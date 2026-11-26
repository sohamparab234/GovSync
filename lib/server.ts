import {env} from 'cloudflare:workers';
import type {ApplicationRecord} from './types';
export function database(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export class ApiError extends Error{constructor(public status:number,message:string,public code?:string){super(message);}}
export async function application(id:string,user:string):Promise<ApplicationRecord>{const row=await database().prepare('SELECT * FROM applications WHERE id = ? AND owner = ?').bind(id,user).first<ApplicationRecord>();if(!row)throw new ApiError(404,'Application not found.');return row;}
export function consent(row:{consent:number;expires_at:string;scopes:string},scope?:string){if(!row.consent||row.expires_at<=new Date().toISOString())throw new ApiError(403,'Consent is revoked or expired. Start a new application with fresh consent.');if(scope&&!JSON.parse(row.scopes).includes(scope))throw new ApiError(403,'Permission for this source has not been granted.');}
export function event(user:string,appId:string|null,action:string,outcome:string,details:string,dept:string|null=null,duration:number|null=null){return database().prepare('INSERT INTO audit (id,owner,application_id,action,department,outcome,details,duration_ms,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),user,appId,action,dept,outcome,details,duration,new Date().toISOString());}
export async function body(request:Request){try{const text=await request.text();if(text.length>12000)throw new Error();const value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value;}catch{throw new ApiError(400,'A valid JSON request body is required (maximum 12 KB).');}}
export function reply(data:unknown,status=200,headers:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','API-Version':'1.0','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',...headers}});}
export async function guarded(fn:(requestId:string)=>Promise<Response>,request?:Request){
 const requestId=request?.headers?.get('x-request-id')||crypto.randomUUID();
 try{
  const res=await fn(requestId);
  const newHeaders=new Headers(res.headers);
  if(!newHeaders.has('x-request-id')&&!newHeaders.has('X-Request-Id'))newHeaders.set('X-Request-Id',requestId);
  if(!newHeaders.has('api-version')&&!newHeaders.has('API-Version'))newHeaders.set('API-Version','1.0');
  if(!newHeaders.has('x-content-type-options')&&!newHeaders.has('X-Content-Type-Options'))newHeaders.set('X-Content-Type-Options','nosniff');
  if(!newHeaders.has('x-frame-options')&&!newHeaders.has('X-Frame-Options'))newHeaders.set('X-Frame-Options','DENY');
  return new Response(res.body,{status:res.status,statusText:res.statusText,headers:newHeaders});
 }catch(e){
  if(e instanceof ApiError){
   const payload:{error:string;code?:string;requestId:string}={error:e.message,requestId};
   if(e.code)payload.code=e.code;
   const headers:Record<string,string>={'Cache-Control':'no-store','API-Version':'1.0','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Request-Id':requestId};
   if(e.status===405)headers['Allow']='GET, POST, OPTIONS, HEAD';
   return Response.json(payload,{status:e.status,headers});
  }
  console.error('GovSync request failed',e);
  return Response.json({error:'The service could not complete this request. Your saved application is retained. Please retry.',code:'SERVICE_UNAVAILABLE',requestId},{status:503,headers:{'Cache-Control':'no-store','API-Version':'1.0','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Request-Id':requestId}});
 }
}
let grievanceTablesInitialized=false;
export async function initGrievanceTables(db:ReturnType<typeof database>){
 if(grievanceTablesInitialized)return;
 try{
  await db.batch([
   db.prepare(`CREATE TABLE IF NOT EXISTS grievances (
    id TEXT PRIMARY KEY,
    reference_number TEXT NOT NULL UNIQUE,
    owner TEXT NOT NULL,
    citizen_id TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    application_id TEXT,
    service TEXT,
    department TEXT,
    department_verified INTEGER DEFAULT 1 NOT NULL,
    status TEXT DEFAULT 'submitted' NOT NULL,
    citizen_response TEXT,
    admin_note TEXT,
    resolution_summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    resolved_at TEXT
   )`),
   db.prepare(`CREATE INDEX IF NOT EXISTS idx_grievances_owner ON grievances (owner)`),
   db.prepare(`CREATE INDEX IF NOT EXISTS idx_grievances_app ON grievances (application_id)`),
   db.prepare(`CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances (status)`),
   db.prepare(`CREATE TABLE IF NOT EXISTS grievance_events (
    id TEXT PRIMARY KEY,
    grievance_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL
   )`),
   db.prepare(`CREATE INDEX IF NOT EXISTS idx_grievance_events_grievance_id ON grievance_events (grievance_id)`)
  ]);
  grievanceTablesInitialized=true;
 }catch(err){
  console.warn('Grievance tables init check:',err);
 }
}
