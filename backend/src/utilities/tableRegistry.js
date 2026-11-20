// Read-only registry for the few resources that may use generic list/detail handlers.
// Writes for products, services, orders and user-owned data must go through domain modules.
module.exports={
  categories:{tableName:'categories',primaryKey:'id',allowedReadableFields:['id','parent_id','name_prs','name_en','name_ps','slug','description','category_type','is_active','sort_order','created_at','updated_at'],filters:['id','parent_id','slug','category_type','is_active'],sortableFields:['id','name_en','sort_order','created_at']},
  products:{tableName:'products',primaryKey:'id',allowedReadableFields:['id','seller_id','category_id','name','slug','description','sku','price','compare_at_price','stock_quantity','condition_status','listing_status','is_featured','created_at','updated_at'],filters:['id','category_id','listing_status','is_featured'],sortableFields:['id','name','price','created_at','updated_at']},
  services:{tableName:'services',primaryKey:'id',allowedReadableFields:['id','seller_id','category_id','name','slug','description','price','pricing_type','estimated_duration_minutes','availability_notes','listing_status','created_at','updated_at'],filters:['id','category_id','listing_status','pricing_type'],sortableFields:['id','name','price','created_at','updated_at']}
};
