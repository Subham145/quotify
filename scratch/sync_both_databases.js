const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const rootDbPath = path.resolve(__dirname, '../quotify.db');
const backendDbPath = path.resolve(__dirname, '../backend/quotify.db');

console.log('Root DB:', rootDbPath, 'exists:', fs.existsSync(rootDbPath));
console.log('Backend DB:', backendDbPath, 'exists:', fs.existsSync(backendDbPath));

const dbR = new Database(rootDbPath);
const dbB = new Database(backendDbPath);

// 1. Get WADI products from root DB or seedData.json
let wadiProds = dbR.prepare('SELECT * FROM products WHERE category = ?').all('WADI');
console.log(`Found ${wadiProds.length} WADI products in root DB.`);

if (wadiProds.length === 0) {
  const seedPath = path.resolve(__dirname, '../backend/seedData.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  wadiProds = (seed.products || []).filter(p => p.category === 'WADI');
  console.log(`Fallback: Found ${wadiProds.length} WADI products in seedData.json.`);
}

// 2. Insert into backend DB
const insertStmtB = dbB.prepare(`
  INSERT INTO products (
    product_name, code, group_id, category, hsn_code,
    price, gst_rate, unit, stock_quantity, created_at,
    hp, kw, head, flow_rate, pipe_size, solid_size, stages, specs
  ) VALUES (
    @product_name, @code, @group_id, @category, @hsn_code,
    @price, @gst_rate, @unit, @stock_quantity, @created_at,
    @hp, @kw, @head, @flow_rate, @pipe_size, @solid_size, @stages, @specs
  )
`);

dbB.prepare("DELETE FROM products WHERE category = 'WADI'").run();

const txB = dbB.transaction((prods) => {
  for (const p of prods) {
    insertStmtB.run({
      product_name: p.product_name,
      code: p.code,
      group_id: p.group_id || 607,
      category: 'WADI',
      hsn_code: p.hsn_code || '84137010',
      price: p.price || 0,
      gst_rate: p.gst_rate || 18,
      unit: p.unit || 'SET',
      stock_quantity: p.stock_quantity || 10,
      created_at: p.created_at || new Date().toISOString(),
      hp: p.hp || '',
      kw: p.kw || '',
      head: p.head || '',
      flow_rate: p.flow_rate || '',
      pipe_size: p.pipe_size || '',
      solid_size: p.solid_size || '',
      stages: p.stages || '1',
      specs: typeof p.specs === 'object' ? JSON.stringify(p.specs) : (p.specs || null)
    });
  }
});
txB(wadiProds);

// Also sync DIGISET products if missing in backend DB
const digisetInB = dbB.prepare("SELECT count(*) as count FROM products WHERE category = 'DIGISET'").get();
if (!digisetInB || digisetInB.count < 16) {
  const digisetProds = dbR.prepare("SELECT * FROM products WHERE category = 'DIGISET'").all();
  if (digisetProds.length > 0) {
    dbB.prepare("DELETE FROM products WHERE category = 'DIGISET'").run();
    const txDigi = dbB.transaction((prods) => {
      for (const p of prods) {
        insertStmtB.run({
          product_name: p.product_name,
          code: p.code,
          group_id: p.group_id || null,
          category: 'DIGISET',
          hsn_code: p.hsn_code || '8502',
          price: p.price || 0,
          gst_rate: p.gst_rate || 18,
          unit: p.unit || 'SET',
          stock_quantity: p.stock_quantity || 10,
          created_at: p.created_at || new Date().toISOString(),
          hp: p.hp || '',
          kw: p.kw || '',
          head: p.head || '',
          flow_rate: p.flow_rate || '',
          pipe_size: p.pipe_size || '',
          solid_size: p.solid_size || '',
          stages: p.stages || '1',
          specs: typeof p.specs === 'object' ? JSON.stringify(p.specs) : (p.specs || null)
        });
      }
    });
    txDigi(digisetProds);
    console.log(`Synced ${digisetProds.length} DIGISET products into backend DB.`);
  }
}

// Ensure categories in backend DB
dbB.prepare("INSERT OR IGNORE INTO product_categories (name, is_active) VALUES ('WADI', 1)").run();
dbB.prepare("INSERT OR IGNORE INTO product_categories (name, is_active) VALUES ('DIGISET', 1)").run();
dbB.prepare("INSERT OR IGNORE INTO product_categories (name, is_active) VALUES ('DEWAS', 1)").run();

// Clean any duplicate or lowercase categories
dbB.prepare("UPDATE products SET category = 'WADI' WHERE UPPER(category) = 'WADI'").run();
dbB.prepare("UPDATE products SET category = 'DIGISET' WHERE UPPER(category) = 'DIGISET'").run();
dbB.prepare("UPDATE products SET category = 'DEWAS' WHERE UPPER(category) = 'DEWAS'").run();

console.log('Categories in backend/quotify.db:');
console.log(dbB.prepare('SELECT category, count(*) as count FROM products GROUP BY category').all());

console.log('Categories in root quotify.db:');
console.log(dbR.prepare('SELECT category, count(*) as count FROM products GROUP BY category').all());

