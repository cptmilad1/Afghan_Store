const { query } = require('../config/db.config');
const ApiError = require('./ApiError');
const ApiResponse = require('./ApiResponse');
const tableRegistry = require('./tableRegistry');
const validDirections = new Set(['asc','desc']);
const normalizeId = (value) => { const v=String(value??''); if(!/^[1-9]\d*$/.test(v)) throw new ApiError(400,'Invalid resource id.'); return v; };
const getConfig=(name)=>{const c=tableRegistry[name];if(!c)throw new ApiError(404,'Resource not available for generic CRUD.');return c;};
const selectFields=(c)=>c.allowedReadableFields.map(f=>`"${f}"`).join(', ');
const sanitizeFilters=(input,c)=>Object.fromEntries(Object.entries(input||{}).filter(([k,v])=>c.filters.includes(k)&&v!==undefined&&v!==null&&v!==''));
const sanitizeSort=(sort,c)=>{if(!sort){const f=c.sortableFields.includes('created_at')?'created_at':c.sortableFields[0];return `"${f}" DESC`;}const [field,direction='asc']=String(sort).split(':');if(!c.sortableFields.includes(field))throw new ApiError(400,`Unsupported sort field: ${field}`);if(!validDirections.has(direction.toLowerCase()))throw new ApiError(400,'Sort direction must be asc or desc.');return `"${field}" ${direction.toUpperCase()}`;};
const sanitizePageLimit=(page,limit,max=100)=>{const p=Number(page??1),l=Number(limit??20);if(!Number.isInteger(p)||p<1)throw new ApiError(400,'Page must be a positive integer.');if(!Number.isInteger(l)||l<1||l>max)throw new ApiError(400,`Limit must be between 1 and ${max}.`);return {page:p,limit:l};};
const list=(name,options={})=>async(req,res,next)=>{try{const c=getConfig(name),p=sanitizePageLimit(req.query.page,req.query.limit,options.maxLimit||100),filters=sanitizeFilters(req.query,c),sort=sanitizeSort(req.query.sort,c),values=[],conditions=[];for(const [k,v] of Object.entries(filters)){conditions.push(`"${k}"=$${values.length+1}`);values.push(v);}const where=conditions.length?`WHERE ${conditions.join(' AND ')}`:'';const count=await query(`SELECT COUNT(*)::bigint total FROM "${c.tableName}" ${where}`,values);const rows=await query(`SELECT ${selectFields(c)} FROM "${c.tableName}" ${where} ORDER BY ${sort} LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,p.limit,(p.page-1)*p.limit]);const total=Number(count.rows[0].total);return ApiResponse.success(res,{items:rows.rows,pagination:{page:p.page,limit:p.limit,total,totalPages:Math.ceil(total/p.limit)}});}catch(e){next(e);}};
const getById=(name)=>async(req,res,next)=>{try{const c=getConfig(name);const {rows}=await query(`SELECT ${selectFields(c)} FROM "${c.tableName}" WHERE "${c.primaryKey}"=$1`,[normalizeId(req.params.id)]);if(!rows[0])throw new ApiError(404,`${name} not found.`);return ApiResponse.success(res,rows[0]);}catch(e){next(e);}};
// Generic writes are intentionally disabled. Business resources must enforce ownership and state transitions in their own module.
const forbidden=()=> (req,res,next)=>next(new ApiError(403,'Generic writes are disabled for this resource. Use its domain-specific API.'));
module.exports={list,getById,create:forbidden,update:forbidden,remove:forbidden,sanitizeSort,sanitizePageLimit,normalizeId};
