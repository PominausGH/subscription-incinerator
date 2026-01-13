// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills for Prisma client compatibility with Jest
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
