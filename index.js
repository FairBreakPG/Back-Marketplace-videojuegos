import express from 'express';
import cors from 'cors';
import { obtener } from './consultas.js'; //archivo que conexta a BD

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

//llamados a apis

app.listen(port, () => console.log(`Servidor escuchando en puerto ${port}`));
