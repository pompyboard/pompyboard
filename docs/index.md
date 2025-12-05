---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Wonkle
  tagline: Made by gamers, for gamers.
  image:
    src: /favicon.svg
    alt: Wonkle logo
  actions:
    - theme: brand
      text: Frequently Asked Questions
      link: /faq

    - theme: alt
      text: User Manual
      link: /manual

    - theme: alt
      text: Builder Documentation
      link: /docs

    - theme: alt
      text: Blog
      link: /blog
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(in oklch -45deg, #a6d189, #8caaee);

  --vp-home-hero-image-background-image: linear-gradient(in oklch 135deg, #d20f39 20%, #40a02b 40%, #1e66f5 90%);
  --vp-home-hero-image-filter: blur(20px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(35px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(40px);
  }
}
</style>
