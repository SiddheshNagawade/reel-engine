import {loadFont as montserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as inter} from '@remotion/google-fonts/Inter';
import {loadFont as playfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as yellowtail} from '@remotion/google-fonts/Yellowtail';
import {loadFont as anton} from '@remotion/google-fonts/Anton';
import {loadFont as chewy} from '@remotion/google-fonts/Chewy';
import {loadFont as poppins} from '@remotion/google-fonts/Poppins';
import {loadFont as dmSerif} from '@remotion/google-fonts/DMSerifDisplay';

export const fonts = {
  montserrat: montserrat('normal', {weights: ['800', '900'], subsets: ['latin']}).fontFamily,
  inter: inter('normal', {weights: ['500', '700', '800'], subsets: ['latin']}).fontFamily,
  playfairItalic: playfair('italic', {weights: ['700'], subsets: ['latin']}).fontFamily,
  yellowtail: yellowtail('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  anton: anton('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  chewy: chewy('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
  poppins: poppins('normal', {weights: ['600', '800'], subsets: ['latin']}).fontFamily,
  dmSerif: dmSerif('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
};

// Kept for older imports.
export const fontFamily = fonts.montserrat;
