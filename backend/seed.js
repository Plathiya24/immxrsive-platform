require('dotenv').config();
require('./store').openStore().then(async s => { await s.importFixtures(); await s.close(); console.log('Fixtures imported.'); }).catch(e => { console.error(e); process.exitCode=1; });
