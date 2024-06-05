import React, {FC} from 'react';
import {Text, View} from 'react-native';
import {styles} from '../Locations.styles';
import LottieView from 'lottie-react-native';
import {lotties} from 'src/assets/lotties';

type ListLocationHeaderProps = {
  isScheduleLocationEnable: boolean;
  isNotMoving: boolean;
  notificationSecondLeft: number;
};

export const ListLocationHeader: FC<ListLocationHeaderProps> = ({
  isScheduleLocationEnable,
  isNotMoving,
  notificationSecondLeft,
}: ListLocationHeaderProps) => {
  return isScheduleLocationEnable ? (
    <View style={styles.rowBetween}>
      <View style={styles.row}>
        <LottieView
          source={lotties.location}
          style={styles.animationSize}
          autoPlay
          loop
        />
        <Text>collecting locations...</Text>
      </View>
      <View>
        {isNotMoving && (
          <Text
            style={
              styles.smallLabel
            }>{`Not moving(${notificationSecondLeft}s)`}</Text>
        )}
      </View>
    </View>
  ) : null;
};
