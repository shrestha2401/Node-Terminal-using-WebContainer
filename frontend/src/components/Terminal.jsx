import React, { useEffect, useState, useRef } from "react";
import { WebContainer } from "@webcontainer/api";

const Terminal=()=>{
  const[wc,setwc]=useState(null);
  const[history,setHistory]=useState([]); 
  const[command,setCommand]=useState("");const terminalRef=useRef(null);
  useEffect(()=>{
    const initWebContainer=async()=>{
     const instance=await WebContainer.boot();
      await instance.mount({
        "package.json": {
          file:{
            contents:JSON.stringify({
              name:"webcontainer-project",
              version:"1.0.0",
              scripts:{start: "echo 'Hello from npm start!'",},
            }),},
        },});
      const installProcess = await instance.spawn("npm",["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk){
            setHistory((prev)=>[
              ...prev,
              {type:"output",content:chunk},]);},}));
      setwc(instance);
    };

  // initiaite webc

    initWebContainer();
  }, []);

  const executeCommand = async () => {
    if (wc && command.trim()) {
      const currentCommand = `$ ${command}`;
      setHistory((prev) => [...prev, { type: "command", content: currentCommand }]);
      const [cmd, ...args] = command.split(" ");
      const process = await wc.spawn(cmd, args);
      process.output.pipeTo(
        new WritableStream({
          write(chunk){
            setHistory((prev)=>[...prev,{type:"output",content:chunk}]);
          },
        })
      );
      setCommand("");await process.exit;
    }
  };
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);
  return (
    <div
      style={{display: "flex",flexDirection: "column",height:"400px",width:"600px",fontFamily:"monospace",backgroundColor:"black",color:"white",border:"1px solid #444",padding:"10px",}}>
      <div
        ref={terminalRef}
        style={{flex:1,overflow:"hidden",whiteSpace:"pre-wrap",textAlign:"left",padding:"10px",maxHeight:"100%",}}>
        {history.map((cumand,i)=>(
          <div
            key={i}
            style={{
              color: cumand.type === "command" ? "#00ff00" : "white",}}>
            {cumand.content}
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        <input
          style={{flex:1,backgroundColor:"black",color:"white",border:"none",outline:"none",textAlign:"left",}}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") executeCommand();}}
          placeholder="Type a command..."
        />
      </div>
    </div>
  );
};

export default Terminal;
