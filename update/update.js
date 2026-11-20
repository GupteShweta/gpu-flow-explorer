
(function(){
 const $=s=>document.querySelector(s);
 const socs={
  snapdragon:{name:"Snapdragon X Elite / X Plus",cpu:"Qualcomm Oryon CPU",gpu:"Qualcomm Adreno GPU",npu:"Qualcomm Hexagon NPU",cpuSpec:"X Elite: 12 cores; X Plus SKU-dependent core counts",gpuSpec:"Integrated Adreno graphics; capabilities vary by SKU",npuSpec:"Up to 45 TOPS on listed X Elite / X Plus SKUs",memory:"LPDDR5x; X Elite platform lists up to 135 GB/s",arch:"Oryon CPU + Adreno GPU + Hexagon NPU",note:"X Elite and X Plus are separate SKU families. Do not assume every core count, GPU clock or feature applies to every model."},
  amd:{name:"AMD Ryzen AI 300 family",cpu:"AMD Zen 5 / Zen 5c CPU",gpu:"AMD RDNA 3.5 Radeon GPU",npu:"AMD XDNA 2 NPU",cpuSpec:"Family includes configurations up to 12 CPU cores / 24 threads",gpuSpec:"Integrated Radeon 800M-series graphics; model-dependent",npuSpec:"Up to 50 NPU TOPS on Ryzen AI 300 models",memory:"Platform and SKU dependent; shared system memory",arch:"Zen 5 CPU + RDNA 3.5 GPU + XDNA 2 NPU",note:"Ryzen AI 300 includes multiple SKUs and CPU-core mixes. Check the exact processor model for its specification."},
  intel:{name:"Intel Core Ultra 200V family",cpu:"Intel Lion Cove P-cores + Skymont E-cores",gpu:"Intel Xe2 / Arc graphics",npu:"Intel AI Boost NPU 4",cpuSpec:"200V family configuration: 4 P-cores + 4 E-cores",gpuSpec:"Xe2 graphics; up to 8 Xe-cores depending on SKU",npuSpec:"Up to 48 NPU TOPS for the family",memory:"On-package LPDDR5X for this mobile platform",arch:"Lion Cove + Skymont CPU, Xe2 GPU, NPU 4",note:"200V specifications are specific to Lunar Lake mobile SKUs; do not generalise them to every Core Ultra processor."}
 };
 const vendor=$("#socVendor");
 function renderSoc(){
  const s=socs[vendor.value];
  $("#socName").textContent=s.name;$("#socCpu").textContent=s.cpu;$("#socGpu").textContent=s.gpu;$("#socNpu").textContent=s.npu;
  $("#socCpuSpec").textContent=s.cpuSpec;$("#socGpuSpec").textContent=s.gpuSpec;$("#socNpuSpec").textContent=s.npuSpec;$("#socMemory").textContent=s.memory;
  $("#socArchitecture").textContent=s.arch;$("#socNote").textContent=s.note;
  $("#chipCpuLabel").textContent=s.cpu;$("#chipGpuLabel").textContent=s.gpu;$("#chipNpuLabel").textContent=s.npu;
 }
 vendor.addEventListener("change",renderSoc);renderSoc();
 const profiles={
  ai:{name:"On-device AI inference",cpu:18,gpu:22,npu:60,explain:"Prioritise the NPU for supported neural-network operators; CPU prepares data and coordinates; GPU can handle unsupported or graphics-heavy stages."},
  gaming:{name:"3D gaming",cpu:22,gpu:68,npu:10,explain:"GPU handles graphics and parallel shader work; CPU runs game logic, simulation and submission; NPU is generally not the primary renderer."},
  creator:{name:"Video editing and effects",cpu:28,gpu:55,npu:17,explain:"GPU accelerates supported effects and media stages; CPU coordinates editing and codecs; NPU may assist supported AI denoise, upscale or segmentation."},
  office:{name:"Office + video call",cpu:48,gpu:22,npu:30,explain:"CPU handles application logic; GPU composites displays and video; NPU may accelerate supported camera, audio or background effects."}
 };
 function simulate(){
  const p=profiles[$("#workloadType").value], intensity=Number($("#intensity").value), efficiency=Number($("#powerMode").value);
  const raw=[p.cpu,p.gpu,p.npu].map(v=>Math.min(100,Math.round(v*intensity/100)));
  const vals=raw.map(v=>Math.min(100,Math.round(v*(efficiency===0?1.15:efficiency===1?1:0.82))));
  ["cpu","gpu","npu"].forEach((k,i)=>{$("#"+k+"Meter").style.width=vals[i]+"%";$("#"+k+"Load").textContent=vals[i]+"% illustrative load";});
  $("#simWorkloadName").textContent=p.name;
  $("#simExplanation").textContent=p.explain+" These percentages are an invented teaching allocation, not measured utilisation or a benchmark.";
  $("#simBudget").textContent=efficiency===0?"Performance-biased":efficiency===1?"Balanced":"Efficiency-biased";
  $("#intensityValue").textContent=intensity+"%";
 }
 $("#workloadType").addEventListener("change",simulate);$("#intensity").addEventListener("input",simulate);$("#powerMode").addEventListener("change",simulate);simulate();
 const inventory=[
  {tag:"DEMO-LT-014",serial:"DEMO-SN-8K2M",processor:"Qualcomm Snapdragon X Elite",model:"DemoBook 14",status:"Registered"},
  {tag:"DEMO-LT-027",serial:"DEMO-SN-4P7Q",processor:"AMD Ryzen AI 9 HX 370",model:"DemoBook Studio",status:"Registered"},
  {tag:"DEMO-LT-031",serial:"DEMO-SN-6R1T",processor:"Intel Core Ultra 7 258V",model:"DemoBook Air",status:"Reported lost"}
 ];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function renderInventory(items){
  const target=$("#inventoryResults");
  if(!items.length){target.innerHTML='<div class="empty-state">No match in this browser session inventory. A processor model alone cannot uniquely identify a physical PC.</div>';return;}
  target.innerHTML=items.map((r)=>'<div class="record"><b>'+esc(r.tag)+'</b> · '+esc(r.status)+'<p>Serial: '+esc(r.serial)+'<br>Model: '+esc(r.model)+'<br>Processor: '+esc(r.processor)+'</p></div>').join("");
 }
 renderInventory(inventory);
 $("#deviceSearch").addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();
  renderInventory(!q?inventory:inventory.filter(r=>[r.tag,r.serial,r.processor,r.model].join(" ").toLowerCase().includes(q)));
 });
 $("#addDevice").addEventListener("click",()=>{
  const tag=$("#assetTag").value.trim(),serial=$("#serialNumber").value.trim(),processor=$("#processorName").value.trim(),model=$("#deviceModel").value.trim();
  if(!tag||!serial||!processor){$("#formFeedback").textContent="Enter an asset tag, device serial number and processor model.";return;}
  if(inventory.some(r=>r.tag.toLowerCase()===tag.toLowerCase()||r.serial.toLowerCase()===serial.toLowerCase())){$("#formFeedback").textContent="That asset tag or serial number already exists in this session.";return;}
  inventory.push({tag,serial,processor,model:model||"Not supplied",status:"Registered"});
  $("#formFeedback").textContent="Added to this browser session only. It has not been uploaded or saved to a central database.";
  $("#assetTag").value="";$("#serialNumber").value="";$("#processorName").value="";$("#deviceModel").value="";
  renderInventory(inventory);
 });
 $("#markLost").addEventListener("click",()=>{
  const tag=$("#lossTag").value.trim().toLowerCase();
  const r=inventory.find(x=>x.tag.toLowerCase()===tag||x.serial.toLowerCase()===tag);
  if(!r){$("#lossFeedback").textContent="No matching demo inventory record. Search by exact asset tag or serial.";return;}
  r.status="Reported lost (session demo)";
  $("#lossFeedback").textContent=r.tag+" marked as reported lost in this browser session. Preserve purchase/ownership evidence and contact the relevant authorities.";
  renderInventory(inventory);
 });
 $("#copyInventoryCommand").addEventListener("click",()=>{
  const command=$("#showCommand").textContent;
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(command).then(()=>{$("#commandFeedback").textContent="PowerShell command copied."}).catch(()=>{$("#commandFeedback").textContent="Copy unavailable; select and copy the command below."});}
  else $("#commandFeedback").textContent="Clipboard unavailable; select and copy the command below.";
 });
 $("#showCommand").textContent='$cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1 -ExpandProperty Name)\n$bios = Get-CimInstance Win32_BIOS\n$system = Get-CimInstance Win32_ComputerSystem\n$enclosure = Get-CimInstance Win32_SystemEnclosure\n$product = Get-CimInstance Win32_ComputerSystemProduct\n[pscustomobject]@{ Manufacturer=$system.Manufacturer; Model=$system.Model; Processor=$cpu; BIOS_Serial=$bios.SerialNumber; Enclosure_Serial=($enclosure | Select-Object -First 1 -ExpandProperty SerialNumber); Asset_Tag=($enclosure | Select-Object -First 1 -ExpandProperty SMBIOSAssetTag); UUID=$product.UUID } | Format-List';
})();
