const Supervision = require("../models/SupervisionSchema");
const User = require("../models/User");
const Call = require("../models/Call");

let emitToUser = null;

function setEmitFunction(emitFn) {
  emitToUser = emitFn;
}

const initiateCall = async (req, res) => {
  const { studentId, supervisionId } = req.body;
  const supervisorId = req.user.id;

  try {
    const supervision = await Supervision.findOne({
      student: studentId,
      supervisor: supervisorId,
      status: 'active'
    }).populate('student supervisor');

    if (!supervision) {
      return res.status(404).json({
        success: false,
        message: "No active supervision found for this student"
      });
    }

    const generatedRoomId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const call = new Call({
      supervision: supervision._id,
      supervisor: supervisorId,
      student: studentId,
      status: 'initiated',
      roomId: generatedRoomId
    });
    await call.save();

    const responseData = {
      callId: call.roomId, // changed from _id to roomId
      roomId: call.roomId,
      supervisionId: supervision._id,
      callData: {
        participants: {
          supervisor: {
            id: supervision.supervisor._id,
            name: supervision.supervisor.name
          },
          student: {
            id: supervision.student._id,
            name: supervision.student.name
          }
        },
        initiator: 'supervisor'
      }
    };

    emitToUser(studentId.toString(), "incoming_call", {
      callId: call.roomId, // fixed
      supervisionId,
      callData: {
        caller: {
          id: supervisorId,
          name: supervision.supervisor.name
        }
      }
    });

    return res.status(200).json({
      success: true,
      ...responseData
    });
  } catch (error) {
    console.error("Error initiating call:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate call"
    });
  }
};

const joinCall = async (req, res) => {
  const userId = req.user.id;
  const { callId } = req.params;

  try {
    const call = await Call.findOne({ roomId: callId }).populate('supervisor student'); // fixed

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found"
      });
    }

    if (call.supervisor._id.toString() !== userId &&
        call.student._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to join this call"
      });
    }

    const otherUserId = call.supervisor._id.toString() === userId
      ? call.student._id.toString()
      : call.supervisor._id.toString();

    emitToUser(otherUserId, "user_joined", {
      callId,
      userId
    });

    return res.status(200).json({
      success: true,
      callData: {
        participants: {
          supervisor: {
            id: call.supervisor._id,
            name: call.supervisor.name
          },
          student: {
            id: call.student._id,
            name: call.student.name
          }
        }
      }
    });
  } catch (error) {
    console.error("Error joining call:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join call"
    });
  }
};

const endCall = async (req, res) => {
  const userId = req.user.id;
  const { callId } = req.params;

  try {
    const call = await Call.findOne({ roomId: callId }).populate('supervisor student'); // fixed

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found"
      });
    }

    const otherUserId = call.supervisor._id.toString() === userId
      ? call.student._id.toString()
      : call.supervisor._id.toString();

    emitToUser(otherUserId, "call_ended", {
      callId,
      endedBy: userId
    });

    await Call.deleteOne({ roomId: callId }); // fixed

    return res.status(200).json({
      success: true,
      message: "Call ended successfully"
    });
  } catch (error) {
    console.error("Error ending call:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end call"
    });
  }
};

const rejectCall = async (req, res) => {
  const userId = req.user.id;
  const { callId } = req.params;

  try {
    const call = await Call.findOne({ roomId: callId }); // fixed

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found"
      });
    }

    const otherUserId = call.supervisor.toString() === userId
      ? call.student.toString()
      : call.supervisor.toString();

    emitToUser(otherUserId, "call_rejected", {
      callId,
      rejectedBy: userId
    });

    await Call.deleteOne({ roomId: callId }); // fixed

    return res.status(200).json({
      success: true,
      message: "Call rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting call:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject call"
    });
  }
};

module.exports = {
  initiateCall,
  joinCall,
  endCall,
  rejectCall,
  setEmitFunction
};
