import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/Yggdrasil/",
  title: "Yggdrasil",
  description: "Graph-Driven Software Development",
  themeConfig: {
    logo: "/logo.svg",
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
        text: "Guide",
        items: [
          { text: "Core Concepts", link: "/concepts" },
          { text: "Building a Graph", link: "/graph-guide" },
          { text: "Workflow", link: "/workflow" },
          { text: "Agent Walkthrough", link: "/agent-walkthrough" },
          { text: "Adoption Guide", link: "/adoption-guide" },
          { text: "FAQ", link: "/faq" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Overview", link: "/examples" },
          { text: "Playing with Examples", link: "/examples-playing" },
          { text: "Hello World", link: "/examples/hello-world" },
          { text: "Coffee Shop", link: "/examples/coffee-shop" },
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
        text: "Specification",
        collapsed: true,
        items: [
          { text: "Vision and Motivation", link: "/spec/vision" },
          { text: "Context Builder", link: "/spec/context-builder" },
          { text: "Materialization", link: "/spec/materialization" },
          { text: "Drift Detection", link: "/spec/drift-detection" },
        ],
      },
    ],
  },
});
