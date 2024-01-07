export default interface IField3D {
  args: IArguments
  hash: string
  sample: (x: number, y: number, z: number) => number
}
