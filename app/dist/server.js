"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3020;
app.get('/', (req, res) => {
    res.send('Hello World! in Typescript Now'); // modifié
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
//# sourceMappingURL=server.js.map