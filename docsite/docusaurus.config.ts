import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {

  title: 'React Native MediaPipe',
  tagline: 'A React Native Camera and Player for MediaPipe applications',
  favicon: 'img/react-native-mediapipe-favicon.ico',

  // Set the production url of your site here
  url: 'https://cdiddy77.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/react-native-mediapipe/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'cdiddy77', // Usually your GitHub org/user name.
  projectName: 'react-native-mediapipe', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:  'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],


  

  themeConfig: {
    // Replace with your project's social card
    image: 'img/rnmp_logo.png',
    navbar: {
      title: 'React Native MediaPipe',
      logo: {
        alt: 'My Site Logo',
     
        src: 'img/rnmp_logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.loom.com/share/248e835862c7446abacd8812210ae361?sid=67615359-f063-48af-9d39-77016946c3ed',
          label: '\'Getting Started\' Video',
          position: 'left',
        },
        {
          href: 'https://github.com/cdiddy77/react-native-mediapipe',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/2HPuUda3z4',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/cdiddy77/react-native-mediapipe',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} NotReallySure, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

    // ...
    plugins: [require.resolve("@cmfcmf/docusaurus-search-local")],
  



  
};


export default config;