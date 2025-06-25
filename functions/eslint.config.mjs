import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: {
    overrides: {
      'ts/consistent-type-imports': ['error', {
        prefer: 'no-type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'inline-type-imports',
      }],
    },
  },
  stylistic: {
    overrides: {
      'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    },
  },
})
