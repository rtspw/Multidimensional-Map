import typescript from 'rollup-plugin-typescript2'
import packageInfo from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: packageInfo.main,
      format: 'cjs',
    },
    {
      file: packageInfo.module,
      format: 'es',
    },
  ],
  plugins: [typescript()],
}