import express from 'express';
import cors from 'cors';
import { obtenerPost, escribirPost, modificarPost, eliminarPost } from './detalle.js'; //archivo que conexta a BD

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

//llamados a apis
app.listen(port, () => console.log(`Servidor escuchando en puerto ${port}`));
