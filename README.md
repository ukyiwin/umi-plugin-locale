# umi-plugin-locale ( still work in progress )

[![NPM version](https://img.shields.io/npm/v/umi-plugin-locale.svg?style=flat)](https://npmjs.org/package/umi-plugin-locale)

Umi plugin for i18n, based on [react-intl](https://npmjs.org/react-intl).

## Usage

Save dependencies.

```bash
$ npm install umi-plugin-locale --save-dev
```

Add and config plugin in `.umirc.js`.

```js
export default {
  plugins: [
    'umi-plugin-locale',
  ],
  locale: {
    enable: true,
    default: 'zh-CN',
    baseNavigator: true,
  }
}
```

Add locale file in `src/locale` like `zh-CN.js`.

```js
export default {
  test: '测试',
}
```

Then you can wirte code like this:

```js
import {
  formatMessage,
  setLocale,
  getLocale,
  FormattedMessage,
} from 'umi/locale';

export default () => {
  return <div><FormattedMessage id="test" /></div>
}
```

## Examples

* [locale with this plugin](https://github.com/umijs/umi-plugin-locale/tree/master/examples/base)

## Debug

```sh
cd examples/base
npm link ../../
npm i
umi dev
```

## Todo

- dynamic
- support use without antd

## LICENSE

MIT
