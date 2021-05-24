module.exports = {
  extends: ['eslint-config-react-typescript'],
  env: {
    node: true,
  },
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
}
