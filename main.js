let APP_ID="3ca88e9c798a43cebd2b48df389b989e"
let token;
let uid=String(Math.floor(Math.random()*10000));

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

const servers= {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
        }
    ]
}

let init= async ()=>{

    client= await AgoraRTM.createInstance(APP_ID);
    console.log(client);
    await client.login({uid,token});

    channel= client.createChannel('main');
    await channel.join();

    channel.on('MemberJoined',handleUserJoined);
    //channel.on('MemberLeft',handleUserLeft);
    client.on('MessageFromPeer',handleMessageFromPeer);

    localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:false})
    document.getElementById('user-1').srcObject =localStream

   
}

let handleUserLeft= (MemberId)=>{
    document.getElementById('user-2').style.display= 'none';
}

let handleMessageFromPeer= async(message,MemberId)=>{
    message=JSON.parse(message.text)
    if(message.type==='offer'){
        createAnswer(MemberId,message.offer);

    }

    if(message.type==='answer'){
        addAnswer(message.answer);
        
    }

    if(message.type==='candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate);
        }
        
    }



}

let handleUserJoined =async(MemberId)=>{
    console.log('A new USer Joined the channel:',MemberId);
    createOffer(MemberId);
}

let createPeerConnection =async(MemberId)=>{
    peerConnection=new RTCPeerConnection(servers);

    remoteStream= new MediaStream()
    

    if(!localStream){
        localStream= await navigator.mediaDevices.getUserMedia({video:true,audio:false})
        document.getElementById('user-1').srcObject =localStream
    }


    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track,localStream)
    });

    peerConnection.ontrack =(event)=>{
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate =async (event)=>{
        if(event.candidate){
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})},MemberId)
        }
    }
}


let createOffer= async (MemberId)=>{
    await createPeerConnection(MemberId);

    let offer=await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId)
}


let createAnswer =async(MemberId,offer)=>{
    await createPeerConnection(MemberId);

    await peerConnection.setRemoteDescription(offer);

    let answer= await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})},MemberId)
}

let addAnswer= async(answer)=>{
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer);
    }



}


init()
