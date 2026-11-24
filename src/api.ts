export type Metric={collected_at:string;cpu:number;memory:number;disk:number};
export type Server={id:number;hostname:string;region:string;status:'online'|'warning'|'offline';collected_at:string|null;cpu:number|null;memory:number|null;disk:number|null};
export type Summary={total:number;online:number;warning:number;offline:number;avg_cpu:number|null};
export type Alert={id:number;hostname:string;metric:string;value:number;opened_at:string;resolved_at:string|null};
export async function get<T>(path:string,signal?:AbortSignal):Promise<T>{
  const response=await fetch('/api/v1'+path,{signal,cache:'no-store'});
  if(!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json() as Promise<T>;
}
