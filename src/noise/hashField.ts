import IField3D from "./IField3D";
import { Md5 } from "ts-md5";

function t(arg: any): any {
  if (arg instanceof Array) {
    return arg.map(t);
  } else if (arg instanceof Object && arg.hasOwnProperty("hash")) {
    return arg.hash;
  } else {
    return arg;
  }
}

export function hashField(f: IField3D) {
  const chunks = Array.prototype.map.call(f.args, (arg) => {
    return t(arg);
  });
  chunks.push(f.sample.toString());
  return Md5.hashStr(chunks.join(";"));
}
