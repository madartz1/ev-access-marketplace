"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="card"><h1>We couldn’t complete that request</h1><p>Check your information and try again. If the issue continues, contact EV Access support.</p><button onClick={reset}>Try again</button></div>}
