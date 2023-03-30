import { createTheme } from '@mui/material/styles'

// declare module '@mui/material/styles' {
//   interface Palette {
//     custom: {
//       background: string;
//       white: string;
//       lightBrue: string;
//       purple: string;
//       yellow: string;
//       active: string;
//       park: string;
//     };
//   }
//   interface PaletteOptions {
//     custom?: {
//       background?: string;
//       white?: string;
//       lightBrue?: string;
//       purple?: string;
//       yellow?: string;
//       active?: string;
//       park?: string;
//     };
//   }
// }

const theme = createTheme({
  palette: {
    primary: {
      main: '#00C1C0'
    },
    secondary: {
      main: '#E9F200'
    },
    // custom: {
    //   background: '#EDEDED',
    //   white: '#EDEEEE',
    //   lightBrue: '#00C2C0',
    //   purple: '#483A67',
    //   yellow: '#E9F300',
    //   active: '#E73A43',
    //   park: '#00DA44'
    // },
    background: {
      default: '#EDEDED'
    }
  },
  typography: {
    fontFamily: ['Oswald'].join(',')
  }
})

export default theme
