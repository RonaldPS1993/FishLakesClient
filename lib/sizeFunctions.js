import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export const responsiveScale = (size) => {
  return scale(size);
};

export const responsiveVerticalScale = (size) => {
  return verticalScale(size);
};

export const responsiveModerateScale = (size) => {
  return moderateScale(size);
};
