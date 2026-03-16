const db = require('./config/db');

const check = async () => {
    try {
        const res = await db.query('SELECT count(*) FROM users');
        console.log('User count:', res.rows[0].count);
        
        const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in public schema:', tables.rows.map(r => r.table_name).join(', '));
        
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
};

check();
