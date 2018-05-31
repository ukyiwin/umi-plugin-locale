const { join, dirname, resolve } = require('path');
const { existsSync, statSync, readdirSync } = require('fs');

// export for test
export function getLocaleFileList(absSrcPath, singular) {
  const localeList = [];
  const localePath = join(absSrcPath, singular ? 'locale' : 'locales');
  if (existsSync(localePath)) {
    const localePaths = readdirSync(localePath);
    for (let i = 0; i < localePaths.length; i++) {
      const fullname = join(localePath, localePaths[i]);
      const stats = statSync(fullname);
      const fileInfo = /^([a-z]{2})-([A-Z]{2})\.(js|ts)$/.exec(localePaths[i]);
      if (stats.isFile() && fileInfo) {
        localeList.push({
          lang: fileInfo[1],
          country: fileInfo[2],
          name: fileInfo[1] + '-' + fileInfo[2],
          path: fullname,
        });
      }
    }
  }
  return localeList;
}

export default function (api) {
  const { IMPORT } = api.placeholder;
  const { paths, config } = api.service;
  const { winPath } = api.utils;

  api.register('modifyConfigPlugins', ({ memo }) => {
    memo.push(api => {
      return {
        name: 'locale',
        onChange(config) {
          api.service.filesGenerator.rebuild();
        }
      }
    });
    memo.push(api => {
      return {
        name: 'singular',
        onChange(config) {
          api.service.filesGenerator.rebuild();
        }
      }
    });
    return memo;
  });

  api.register('modifyPageWatchers', ({ memo }) => {
    if (!config.locale || !config.locale.enable) {
      return memo;
    }
    return [
      ...memo,
      join(paths.absSrcPath, 'locale'),
    ];
  });

  api.register('modifyRouterContent', ({ memo }) => {
    if (!config.locale || !config.locale.enable) {
      return memo;
    }
    const localeFileList = getLocaleFileList(paths.absSrcPath, config.singular);
    return getLocaleWrapper(localeFileList, memo, config.locale.antd);
  });

  api.register('modifyRouterFile', ({ memo }) => {
    if (!config.locale || !config.locale.enable) {
      return memo;
    }
    const opts = config.locale;
    const localeFileList = getLocaleFileList(paths.absSrcPath, config.singular);
    return memo
      .replace(
        IMPORT,
        `
          ${getInitCode(localeFileList, opts.default, opts.baseNavigator, opts.antd)}
          ${IMPORT}
        `
      );
  });

  api.register('modifyAFWebpackOpts', ({ memo }) => {
    if (!config.locale || !config.locale.enable) {
      return memo;
    }
    memo.alias = {
      ...(memo.alias || {}),
      'umi/locale': join(__dirname, './locale.js'),
      'react-intl': dirname(require.resolve('react-intl/package.json')),
    };
    return memo;
  });



  function getLocaleWrapper(localeList, inner, antd = true) {
    let ret = inner;
    if (localeList.length) {
      ret = `<IntlProvider locale={appLocale.locale} messages={appLocale.messages}>
        <InjectedWrapper>${ret}</InjectedWrapper>
      </IntlProvider>`;
    }
    if (antd) {
      ret = `<LocaleProvider locale={appLocale.antd || defaultAntd}>
        ${ret}
      </LocaleProvider>`;
    }
    return ret;
  }

  function getInitCode(
    localeList,
    defaultLocale = 'zh-CN',
    baseNavigator = true,
    antd = true,
    useLocalStorage = true,
  ) {
    // 初始化依赖模块的引入
    // 把 locale 文件夹下的所有的模块的数据添加到 localeInfo 中
    // 然后按照优先级依次从 localStorage, 浏览器 Navigator（baseNavigator 为 true 时），default 配置中取语言设置
    // 如果 locale 下没有符合规则的文件，那么也可以仅仅针对 antd 做国际化
    return `
      ${localeList.length ? 'import { addLocaleData, IntlProvider, injectIntl } from \'react-intl\';' : ''}
      ${localeList.length ? 'import { _setIntlObject } from \'umi/locale\';' : ''}
      ${localeList.length ? `const InjectedWrapper = injectIntl(function(props) {
        _setIntlObject(props.intl);
        return props.children;
      })` : ''}
      const baseNavigator = ${baseNavigator};
      ${ antd ? `import { LocaleProvider } from 'antd';` : '' }
      ${ antd ? `const defaultAntd = require('antd/lib/locale-provider/${defaultLocale.replace('-', '_')}');` : ''}
      const localeInfo = {
        ${localeList.map(locale => `'${locale.name}': {
            messages: require('${winPath(locale.path)}').default,
            locale: '${locale.name}',
            ${ antd ? `antd: require('antd/lib/locale-provider/${locale.lang}_${locale.country}'),` : '' }
            data: require('react-intl/locale-data/${locale.lang}'),
          }`
  ).join(',\n')}
      };
      let appLocale = {
        locale: '${defaultLocale}',
        messages: {},
      };
      if (${useLocalStorage} && localStorage.getItem('umi_locale') && localeInfo[localStorage.getItem('umi_locale')]) {
        appLocale = localeInfo[localStorage.getItem('umi_locale')];
      } else if (localeInfo[navigator.language] && baseNavigator){
        appLocale = localeInfo[navigator.language];
      } else {
        appLocale = localeInfo['${defaultLocale}'] || appLocale;
      }
      ${localeList.length ? 'appLocale.data && addLocaleData(appLocale.data);' : ''}
    `;
  }
};

