import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Yggdrasil",
  description: "Graph-Driven Software Development",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "CLI Reference", link: "/cli-reference" },
      { text: "GitHub", link: "https://github.com/gaiaan/yggdrasil" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is Yggdrasil?", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Installation", link: "/installation" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Core Concepts", link: "/concepts" },
          { text: "Building a Graph", link: "/graph-guide" },
          { text: "Workflow", link: "/workflow" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "CLI Commands", link: "/cli-reference" },
          { text: "Agent Commands", link: "/agent-commands" },
        ],
      },
      {
        text: "Adoption",
        items: [
          { text: "Adoption Guide", link: "/adoption-guide" },
          { text: "FAQ", link: "/faq" },
        ],
      },
    ],
  },
});
