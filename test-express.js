import express from 'express';
const app = express();
app.get('*all', (req, res) => {
  res.send('catch-all');
});
app.listen(3001, () => console.log('listening'));
