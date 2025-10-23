export default {
  plugins: {
    'postcss-preset-env': {
      features: {
        'color-mix': true,
        'custom-properties': true
      }
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};
