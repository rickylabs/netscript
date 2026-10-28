---
version: alpha
name: Fixture
description: A complete specimen for the design documentation renderer.
colors:
  # Light and dark values must stay paired.
  bg: '#fcfcfc' # Contrast note retained verbatim.
  bg-dark: '#18181a'
  invalid-css: 'red; background: url(javascript:alert(1))'
typography:
  body:
    fontFamily: Fixture Sans
    fontSize: 17px
    fontWeight: 430
    fontFeature: '"tnum" 1'
rounded:
  card: 13px
spacing:
  row-height: 47px
components:
  button:
    background: '{colors.bg}'
    states:
      hover: '{colors.bg-dark}'
motion:
  duration: 170ms
  curves: [ease-in, ease-out]
---

# Fixture

<!-- Internal metadata must stay invisible. -->

## Overview

Overview sentinel. A visible <Theme Name> and escaped <script>alert('fixture')</script>.

## Colors

Colour policy sentinel, distinct from its value table.

## Typography

Typography prose sentinel.

## Layout

Layout sentinel.

## Elevation & Depth

Depth sentinel.

## Shapes

Shape sentinel.

## Components

Component anatomy sentinel.

### Button behavior

Nested component sentinel.

## Do's and Don'ts

Usage sentinel.

## Iconography & Imagery

Imagery sentinel.

## Motion & States

Motion sentinel.

## Accessibility

Accessibility sentinel.

## NetScript Mapping

Mapping sentinel. [Studio](../studio/DESIGN.md) and [guidelines][guidance].

[guidance]: ../../GUIDELINES.md#2-theme-architecture

## Sources

Sources sentinel. [Source skill](SKILL.md).
