const architectures = {
  nvidia: [
    {name:"Ampere (conceptual)",compute:"Streaming Multiprocessor (SM)",group:"Warp",width:"Commonly 32 threads per warp",local:"Shared memory",localDesc:"Programmer-managed on-chip storage; L1/shared-memory design is architecture-specific.",desc:"SMs contain schedulers, register files, execution pipelines and load/store paths.",diagram:"SM array"},
    {name:"Hopper (conceptual)",compute:"Streaming Multiprocessor (SM)",group:"Warp",width:"Commonly 32 threads per warp",local:"Shared memory",localDesc:"On-chip shared storage; Hopper adds features such as thread-block clusters and distributed shared memory.",desc:"SMs execute thread blocks and warps; specialized paths support matrix and other operations.",diagram:"SM array + clusters"}
  ],
  amd: [
    {name:"RDNA (graphics)",compute:"Compute Unit (CU)",group:"Wavefront",width:"Wave size depends on RDNA generation and mode",local:"Local Data Share (LDS)",localDesc:"Low-latency on-chip data sharing within a workgroup; exact capacities vary by product.",desc:"CUs combine vector/scalar processing, scheduling, registers and memory operations.",diagram:"CU array"},
    {name:"CDNA (compute)",compute:"Compute Unit (CU)",group:"Wavefront",width:"Commonly wave64 in CDNA",local:"Local Data Share (LDS)",localDesc:"On-chip shared data store used by cooperating work-items.",desc:"Compute-focused CUs include vector and matrix execution resources, schedulers and register files.",diagram:"CU array"}
  ],
  intel: [
    {name:"Xe-HPG / Xe-HP (conceptual)",compute:"Xe-core",group:"Subgroup",width:"SIMD width and subgroup size vary by GPU and software stack",local:"Shared Local Memory (SLM)",localDesc:"Explicitly managed local storage shared by work-items in a workgroup.",desc:"Xe-cores combine execution units, thread dispatch and shared local resources.",diagram:"Xe-core array"},
    {name:"Xe-HPC (conceptual)",compute:"Xe-core",group:"Subgroup",width:"Architecture and kernel dependent",local:"Shared Local Memory (SLM)",localDesc:"Local on-chip storage supporting cooperative workgroup data exchange.",desc:"Compute-oriented Xe cores provide vector and matrix-oriented execution resources.",diagram:"Xe-core array"}
  ]
};
const vendorEl=document.querySelector("#vendor"), archEl=document.querySelector("#architecture");
const $=s=>document.querySelector(s);
function populateArchitectures(){const list=architectures[vendorEl.value];archEl.innerHTML=list.map((a,i)=>`<option value="${i}">${a.name}</option>`).join("");renderArchitecture();}
function renderArchitecture(){
 const a=architectures[vendorEl.value][Number(archEl.value)||0];
 $("#computeName").textContent=a.compute;$("#groupName").textContent=a.group;$("#groupDesc").textContent=a.width;
 $("#computeDesc").textContent=a.desc;$("#localMemName").textContent=a.local;$("#localMemDesc").textContent=a.localDesc;
 $("#diagramCompute").textContent=a.diagram;$("#diagramGroup").textContent=`${a.group} → lanes`;
}
vendorEl.addEventListener("change",populateArchitectures);archEl.addEventListener("change",renderArchitecture);
const nodeInfo={
 host:"The CPU prepares commands and data buffers. A driver/runtime submits work to the GPU; data may be copied or shared depending on the platform and memory model.",
 vram:"Device memory stores large buffers, textures, model data and other resources. It offers high bandwidth but higher latency than registers and on-chip local storage.",
 compute:"The GPU distributes work across many compute blocks (SMs, CUs or Xe-cores). The exact internal organization differs by vendor and generation.",
 threads:"Threads are grouped into warps, waves or subgroups. Schedulers issue ready groups to execution pipelines; lanes operate on different data elements.",
 output:"Results are written to registers, caches or device memory, then consumed by later GPU work or transferred back to host-visible memory."
};
document.querySelectorAll(".node").forEach(n=>n.addEventListener("click",()=>{
 document.querySelectorAll(".node").forEach(x=>x.classList.remove("selected"));n.classList.add("selected");
 $("#nodeDetail").textContent=nodeInfo[n.dataset.node];
}));
$("#workload").addEventListener("change",e=>{
 const descriptions={vector:"Vector addition: load two arrays, add corresponding elements, store the result.",matrix:"Matrix multiplication: reuse tiles of data and issue many multiply-accumulate operations.",graphics:"Graphics workload: vertex processing, rasterization, fragment shading and render-target writes.",memory:"Memory-bound gather: irregular reads can stall groups while other ready groups execute."};
 $("#nodeDetail").textContent=descriptions[e.target.value];
});

let cfg={threads:256,blocks:4,latency:3},cycle=0,groups=[],log=[],timer=null;
const ceil=(a,b)=>Math.ceil(a/b);
function readControls(){
 cfg.threads=Number($("#threadCount").value);cfg.blocks=Number($("#blockCount").value);cfg.latency=Number($("#latency").value);
 $("#threadCountOut").textContent=cfg.threads;$("#blockCountOut").textContent=cfg.blocks;$("#latencyOut").textContent=cfg.latency+" cycles";
}
function addLog(msg){log.unshift(`Cycle ${cycle}: ${msg}`);log=log.slice(0,7);$("#eventLog").innerHTML=log.map(x=>`<li>${x}</li>`).join("");}
function reset(){
 clearInterval(timer);timer=null;cycle=0;groups=[];
 const groupWidth=vendorEl.value==="nvidia"?32:vendorEl.value==="amd"?64:32;
 const count=ceil(cfg.threads,groupWidth);
 for(let i=0;i<count;i++)groups.push({id:i,threads:Math.min(groupWidth,cfg.threads-i*groupWidth),state:"ready",wait:0,done:false,stage:0,remaining:2});
 log=[];$("#cycle").textContent="0";addLog(`${cfg.threads} logical threads split into ${count} illustrative ${groupWidth}-lane groups.`);renderSim();
}
function step(){
 cycle++;
 groups.forEach(g=>{if(g.state==="waiting"){g.wait--;if(g.wait<=0){g.state="ready";g.remaining=g.stage?1:2;}}});
 const perBlock=ceil(groups.length,cfg.blocks);
 let active=0,waiting=0,completed=0;
 for(let b=0;b<cfg.blocks;b++){
   const slice=groups.slice(b*perBlock,(b+1)*perBlock);
   let running=slice.find(g=>g.state==="active");
   if(!running)running=slice.find(g=>g.state==="ready");
   if(running){running.state="active";running.remaining--;active++;
     if(running.remaining<=0){
       if(running.stage===1){running.state="done";addLog(`Group ${running.id} completed and wrote its result.`);}
       else {running.stage=1;running.state="waiting";running.wait=cfg.latency;addLog(`Group ${running.id} issued memory request; block ${b} switches to other ready work.`);}
     }
   }
 }
 groups.forEach(g=>{if(g.state==="waiting")waiting++;if(g.state==="done")completed++;});
 // A waiting group returns ready after its illustrative memory latency; completion is recorded on a later compute pass.
 groups.forEach(g=>{if(g.state==="active"&&g.remaining<=0)g.state="done";});
 if(groups.every(g=>g.state==="done")){clearInterval(timer);timer=null;$("#phaseLabel").textContent="COMPLETE";addLog("All groups completed the illustrative workload.");}
 else $("#phaseLabel").textContent=waiting?"LATENCY HIDING":"EXECUTING";
 $("#cycle").textContent=cycle;renderSim();
}
function renderSim(){
 const perBlock=ceil(groups.length,cfg.blocks);let active=0,waiting=0,done=0;
 $("#blocks").innerHTML=Array.from({length:cfg.blocks},(_,b)=>{
  const slice=groups.slice(b*perBlock,(b+1)*perBlock);
  const tags=slice.map(g=>{if(g.state==="active")active++;if(g.state==="waiting")waiting++;if(g.state==="done")done++;
    return `<span class="group ${g.state}">G${g.id} ${g.state==="waiting"?"wait":g.state==="done"?"✓":g.state==="active"?"run":"ready"}</span>`;}).join("");
  return `<div class="block"><h4>COMPUTE BLOCK ${b+1}</h4>${tags||'<span class="note">Idle</span>'}</div>`;
 }).join("");
 $("#completed").textContent=`${done* (groups[0]?.threads||0) > cfg.threads?cfg.threads:groups.filter(g=>g.state==="done").reduce((n,g)=>n+g.threads,0)} / ${cfg.threads}`;
 $("#activeGroups").textContent=active;$("#waitingGroups").textContent=waiting;
 $("#utilisation").textContent=Math.round(active/Math.max(1,cfg.blocks)*100)+"%";
}
["threadCount","blockCount","latency"].forEach(id=>$("#"+id).addEventListener("input",()=>{readControls();reset();}));
$("#stepBtn").addEventListener("click",step);
$("#runBtn").addEventListener("click",()=>{if(timer){clearInterval(timer);timer=null;$("#runBtn").textContent="Run simulation";return;}$("#runBtn").textContent="Pause";timer=setInterval(()=>{step();if(!timer)$("#runBtn").textContent="Run simulation";},650);});
$("#resetBtn").addEventListener("click",()=>{readControls();reset();$("#runBtn").textContent="Run simulation";});
vendorEl.addEventListener("change",()=>{readControls();reset();});
populateArchitectures();readControls();reset();
