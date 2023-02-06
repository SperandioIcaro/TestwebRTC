import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAiM_Ylrru8SQc-7CkaAb7CfIMsUQTbIhY",
  authDomain: "teste-webrtc-15529.firebaseapp.com",
  databaseURL: "https://teste-webrtc-15529-default-rtdb.firebaseio.com",
  projectId: "teste-webrtc-15529",
  storageBucket: "teste-webrtc-15529.appspot.com",
  messagingSenderId: "383972909335",
  appId: "1:383972909335:web:2e8e05359c4519c3d95752",
  measurementId: "G-HBZG23QCEX"
};

if(!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}
const firestore = firebase.firestore();

const servers = [
  {
    urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
  }
]

//global state
let pc = new RTCPeerConnection({servers})
let localStream = null
let remoteStream = null

//HTML elements
const webcamButton = document.getElementById('webcamButton')
const webcamVideo = document.getElementById('webcamVideo')
const callButton = document.getElementById('callButton')
const callInput = document.getElementById('callInput')
const answerButton = document.getElementById('answerButton')
const remoteButton = document.getElementById('remoteButton')
const hangupButton = document.getElementById('hangupButton')

//functions
Window.onload = function() {
  webcamButton.onclick = async() => {
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
    remoteStream = new MediaStream()

    //push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream)
    })

    //pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    }

    webcamVideo.srcObject = localStream
    remoteVideo.srcObject = remoteStream
  }
}

  Window.onload = function() {
  callButton.onclick = async() => {
    //reference Firestore collections for signaling
    const callDoc = firestore.collection('calls').doc()
    const offerCandidates = callDoc.collection('offerCandidates')
    const answerCandidates = callDoc.collection('answerCandidates')

    callInput.value = callDoc.id

    //get candidates for caller, save to db
    pc.onicecandidate = event => {
      event.candidate && offerCandidates.add(event.candidate.toJSON())
    }

    //create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const roomWithOffer = {
        offer: {
            type: offer.type,
            sdp: offer.sdp
        }
    }
    const roomRef = await db.collection('rooms').add(roomWithOffer);
    const roomId = roomRef.id;
    document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`

    roomRef.onSnapshot(async snapshot => {
      console.log('Got updated room:', snapshot.data());
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data.answer) {
          console.log('Set remote description: ', data.answer);
          const answer = new RTCSessionDescription(data.answer)
          await peerConnection.setRemoteDescription(answer);
      }
  });

    //when answer is added, add candidate to peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if(change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data())
          pc.addIceCandidate(candidate)
        }
      })
    })
  }
}
Window.onload = function() {
  answerButton.onclick = async () => {
    const callId = callInput.value;
    const callDoc = firestore.collection('calls').doc(callId);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');
  
    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };
  
    const callData = (await callDoc.get()).data();
  
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
  
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
  
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
  
    await callDoc.update({ answer });
  
    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }
}


export default function App() {
  return (
    <div className='flex flex-col'>
        <div className='flex flex-col justify-center itens-center'>
          <h1>teste WebRTC</h1>
          <h3>1. Start your Webcam</h3>
        </div>
        <div className='flex flex-col'>
        <div className='flex flex-row justify-evenly'>
          <span>
            <h3>Local Stream</h3>
            <video id="webcamVideo" autoPlay playsInline></video>
          </span>
          <span>
            <h3>Remote Stream</h3>
            <video id="remoteVideo" autoPlay playsInline></video>
          </span>
        </div>
      </div>
      <div className='flex flex-row justify-evenly'>
        <div className='flex flex-col'>
          <button id="webcamButton">Start webcam</button>
          <button id="callButton" disabled>Create Call (offer)</button>
        </div>
        <div className='flex flex-col'>
          <p>Answer the call from a different browser window or device</p>
          <input id="callInput" />
          <button id="answerButton" disabled>Answer</button>
        </div>
        <div className='flex flex-col'>
          <button id="remoteButton" disabled>Create Call (answer)</button>
          <button id="hangupButton" disabled>Hangup</button>
        </div>
      </div>
    
    </div>
  )
}
