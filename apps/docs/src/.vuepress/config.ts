import { hopeTheme } from 'vuepress-theme-hope'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  lang: 'zh-CN',
  title: 'WeMD 帮助中心',
  description: 'WeMD - 更优雅的 Markdown 公众号排版工具',
  base: '/docs/',
  
  // 开发服务器端口配置
  port: 8080,

  theme: hopeTheme({
    logo: 'https://weimd.gudong.site/favicon-light.svg',
    repo: 'maoruibin/WeiMD',
    docsDir: 'apps/docs/src',
    
    // 主题色配置
    darkmode: 'toggle',
    
    // 导航栏
    navbar: [
      {
        text: '去创作',
        link: 'https://weimd.gudong.site',
        icon: 'pen-to-square',
      },
    ],
    
    // 侧边栏
    sidebar: {
      '/': [
        {
          text: '入门教程',
          icon: 'graduation-cap',
          children: [
            '/guide/quick-start-user.md',
            '/guide/developer-quickstart.md',
          ],
        },
        {
          text: '操作指南',
          icon: 'book',
          children: [
            '/guide/image-hosting.md',
            '/guide/themes.md',
          ],
        },
        {
          text: '技术参考',
          icon: 'code',
          children: [
            '/reference/shortcuts.md',
            '/reference/project-structure.md',
            '/reference/dark-mode-algorithm.md',
          ],
        },
        {
          text: '关于',
          icon: 'circle-info',
          children: [
            '/about/intro.md',
            '/showcase/README.md',
            '/about/changelog.md',
            '/about/faq.md',
          ],
        },
      ],
    },

    // 插件配置
    plugins: {
      mdEnhance: {
        // 启用更多 Markdown 增强功能
        align: true,
        attrs: true,
        codetabs: true,
        demo: true,
        figure: true,
        imgLazyload: true,
        imgSize: true,
        include: true,
        mark: true,
        sub: true,
        sup: true,
        tabs: true,
        tasklist: true,
        vPre: true,
      },
    },
  }),
})
