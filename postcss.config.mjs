/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Note the @ symbol here. This is the new v4 connector.
    autoprefixer: {},
  },
};

export default config;