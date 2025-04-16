const SupervisionDates = require('../models/SupervisionDates');
const supervisionDatesQueue = require('../services/queues/supervisionDates.queue');

// @desc    Set global supervision dates
// @route   PUT /api/supervision-dates
// @access  Private/Coordinator
// Update setSupervisionDates function:
exports.setSupervisionDates = async (req, res) => {
    console.log("Request Body:", req.body);
    try {
      const { dateRanges } = req.body
  
      // ... existing validation code ...
  
      // Clear existing dates
      await SupervisionDates.deleteMany({})
  
      // Create new date records
      const createdDates = await SupervisionDates.insertMany(
        dateRanges.map(range => ({
          startTime: new Date(range.startDate),
          endTime: new Date(range.endDate)
        }))
      )
  
      // Add email notification job to queue for each date range
      for (const range of dateRanges) {
        await supervisionDatesQueue.add({
          dateRange: {
            startDate: range.startDate,
            endDate: range.endDate
          }
        }, {
          attempts: 3, // Retry 3 times if fails
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        })
      }
  
      res.status(200).json({
        success: true,
        data: {
          dateRanges: createdDates.map(date => ({
            startDate: date.startTime,
            endDate: date.endTime
          }))
        }
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: 'Server error' })
    }
  }
  

// @desc    Get all supervision dates
// @route   GET /api/supervision-dates
// @access  Private
exports.getSupervisionDates = async (req, res) => {
  try {
    const dates = await SupervisionDates.find()
      .sort('startTime')
      .lean()

    res.status(200).json({
      success: true,
      data: dates.map(date => ({
        // Map to startDate/endDate in response
        startDate: date.startTime,
        endDate: date.endTime
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

// @desc    Get single supervision date range
// @route   GET /api/supervision-dates/:dateId
// @access  Private/Coordinator
exports.getSingleDateRange = async (req, res) => {
  try {
    const { dateId } = req.params

    const dateRange = await SupervisionDates.findById(dateId)
    if (!dateRange) {
      return res.status(404).json({ success: false, error: 'Date range not found' })
    }

    res.status(200).json({
      success: true,
      data: {
        // Map to startDate/endDate in response
        startDate: dateRange.startTime,
        endDate: dateRange.endTime
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

// @desc    Update a supervision date range
// @route   PUT /api/supervision-dates/:dateId
// @access  Private/Coordinator
exports.updateDateRange = async (req, res) => {
    try {
      const { dateId } = req.params
      const { startDate, endDate } = req.body
  
      // ... existing validation code ...
  
      const updatedRange = await SupervisionDates.findByIdAndUpdate(
        dateId,
        {
          startTime: new Date(startDate),
          endTime: new Date(endDate)
        },
        { new: true }
      )
  
      if (!updatedRange) {
        return res.status(404).json({ success: false, error: 'Date range not found' })
      }
  
      // Add email notification job to queue
      await supervisionDatesQueue.add({
        dateRange: {
          startDate,
          endDate
        }
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      })
  
      res.status(200).json({
        success: true,
        data: {
          startDate: updatedRange.startTime,
          endDate: updatedRange.endTime
        }
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ success: false, error: 'Server error' })
    }
}

// @desc    Delete a supervision date range
// @route   DELETE /api/supervision-dates/:dateId
// @access  Private/Coordinator
exports.deleteSupervisionDate = async (req, res) => {
  try {
    const { dateId } = req.params

    const date = await SupervisionDates.findByIdAndDelete(dateId)
    if (!date) {
      return res.status(404).json({ success: false, error: 'Date range not found' })
    }

    res.status(200).json({
      success: true,
      data: {}
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}