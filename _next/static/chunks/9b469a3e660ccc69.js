(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,38749,e=>{"use strict";var t=e.i(43476);function r({checked:e,onChange:r,id:n,disabled:o=!1,className:i=""}){return(0,t.jsx)("button",{type:"button",id:n,role:"switch","aria-checked":e,disabled:o,onClick:()=>r(!e),className:`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
        border-2 transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-retro-cyan focus:ring-offset-2 focus:ring-offset-retro-dark
        ${e?"bg-retro-pink border-retro-pink":"bg-retro-purple/50 border-retro-purple"}
        ${o?"opacity-50 cursor-not-allowed":""}
        ${i}
      `,children:(0,t.jsx)("span",{className:`
          pointer-events-none inline-block h-5 w-5 transform rounded-full
          shadow ring-0 transition duration-200 ease-in-out
          ${e?"translate-x-5 bg-white":"translate-x-0 bg-gray-400"}
        `})})}e.s(["ToggleSwitch",()=>r])},7506,e=>{"use strict";var t=e.i(71645);function r(e){let r=(0,t.useRef)(null),[n,o]=(0,t.useState)({width:0,height:0}),i=(0,t.useCallback)(t=>{o(t),e?.(t)},[e]);return(0,t.useEffect)(()=>{let e=r.current;if(e){let t,r;return(t=new ResizeObserver(e=>{for(let t of e){let{width:e,height:r}=t.contentRect;i({width:e,height:r})}})).observe(e),i({width:(r=e.getBoundingClientRect()).width,height:r.height}),()=>t.disconnect()}},[i]),{ref:r,size:n}}e.s(["useResizeObserver",()=>r])}]);