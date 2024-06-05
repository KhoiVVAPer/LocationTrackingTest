/* eslint-disable react-hooks/exhaustive-deps */
import {Location} from 'src/types';
import {useLocationPermissions} from '@hooks/useLocationPermissions';
import {AppState} from 'react-native';
import GetLocation from 'react-native-get-location';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {usePersistState} from '@hooks/usePersistState';
import BackgroundTimer from 'react-native-background-timer';
import notifee from '@notifee/react-native';
import {
  DEFAULT_NOTIFICATION_SCHEDULE,
  DEFAULT_REQUEST_LOCATION_TIME,
  DEFAULT_FETCH_LOCATION_TIMEOUT,
} from 'src/const';
import {displayNotification} from 'src/utils/helper/notification';

type AppContextData = {
  requestLocationInterval: number;
  setRequestLocationInterval: (second: number) => void;
  listLocation: Location[];
  setListLocation: (listLocations: Location[]) => void;
  isDisabledLocationPermission: boolean;
  isScheduleNotificationEnable: boolean;
  isScheduleLocationEnable: boolean;
  startScheduleNotification: () => void;
  stopScheduleNotification: () => void;
  requestScheduleNotificationInterval: number; //seconds
  setRequestScheduleNotificationInterval: (second: number) => void;
  isDisabledNotificationPermission: boolean;
  stopFetchingUserLocation: () => void;
  startFetchingUserLocation: () => void;
  notificationSecondLeft: number;
  isNotMoving: boolean;
};

const defaultContextValues: AppContextData = {
  requestLocationInterval: DEFAULT_REQUEST_LOCATION_TIME,
  setRequestLocationInterval: () => undefined,
  listLocation: [],
  isDisabledLocationPermission: false,
  setListLocation: () => undefined,
  isScheduleNotificationEnable: true,
  isScheduleLocationEnable: true,
  startScheduleNotification: () => undefined,
  stopScheduleNotification: () => undefined,
  requestScheduleNotificationInterval: DEFAULT_NOTIFICATION_SCHEDULE,
  setRequestScheduleNotificationInterval: () => undefined,
  isDisabledNotificationPermission: false,
  stopFetchingUserLocation: () => undefined,
  startFetchingUserLocation: () => undefined,
  notificationSecondLeft: DEFAULT_NOTIFICATION_SCHEDULE,
  isNotMoving: false,
};

export const AppContext = createContext<AppContextData>(defaultContextValues);

export function useAppContextValue(): AppContextData {
  const fetchLocationIntervalRef = useRef<NodeJS.Timeout>();
  const [_requestLocationInterval, setRequestLocationInterval] =
    usePersistState('requestLocationInterval', DEFAULT_REQUEST_LOCATION_TIME);
  const [_listLocation, setListLocation] = usePersistState('listLocations', []);
  const [_isDisabledLocationPermission, setIsDisabledLocationPermission] =
    useState<boolean>(false);
  const [_isScheduleLocationEnable, setIsScheduleLocationEnable] =
    usePersistState('isScheduleLocationEnable', true);
  const [_isScheduleNotificationEnable, setIsScheduleNotificationEnable] =
    usePersistState('isScheduleNotificationEnable', true);
  const [
    _requestScheduleNotificationInterval,
    setRequestScheduleNotificationInterval,
  ] = useState(DEFAULT_NOTIFICATION_SCHEDULE);
  const [_notificationSecondLeft, setNotificationSecondLeft] = useState(
    DEFAULT_NOTIFICATION_SCHEDULE,
  );
  const {checkPermission, requestPermission} = useLocationPermissions();
  const [
    _isDisabledNotificationPermission,
    setIsDisabledNotificationPermission,
  ] = useState<boolean>(false);
  const [_isNotMoving, setIsNotMoving] = useState<boolean>(false);

  const checkLocationPermission = useCallback(() => {
    checkPermission().then(value => {
      const isGranted = value === 'granted';
      setIsDisabledLocationPermission(!isGranted);
      if (isGranted) {
        setIsScheduleLocationEnable(true);
      }
    });
  }, [checkPermission]);

  const checNotificationPermission = useCallback(() => {
    notifee.requestPermission().then(value => {
      const isGranted = value.authorizationStatus === 1;
      setIsDisabledNotificationPermission(!isGranted);
    });
  }, []);

  useEffect(() => {
    checkLocationPermission();
    requestPermission().then(() => {
      checNotificationPermission();
    });
    const appStateListener = AppState.addEventListener('change', state => {
      //check location permission each time user back to the app
      if (state === 'active') {
        checkLocationPermission();
        checNotificationPermission();
      }
    });
    return () => {
      appStateListener.remove();
    };
  }, [checkLocationPermission, requestPermission]);

  useEffect(() => {
    if (_notificationSecondLeft === 0) {
      //timeout
      const convertToSeconds = _requestScheduleNotificationInterval / 1000;
      const convertToMinutes = Math.round(convertToSeconds / 60);

      displayNotification(
        `${
          convertToMinutes >= 1
            ? `${convertToMinutes} minutes`
            : `${convertToSeconds} seconds`
        }`,
      );
      setNotificationSecondLeft(_requestScheduleNotificationInterval);
    } else {
      setNotificationSecondLeft(_notificationSecondLeft);
    }
  }, [_requestScheduleNotificationInterval, _notificationSecondLeft]);

  useEffect(() => {
    //update countdown timer when user override setting
    setNotificationSecondLeft(_requestScheduleNotificationInterval);
  }, [_requestScheduleNotificationInterval]);

  useEffect(() => {
    if (_isScheduleLocationEnable) {
      startFetchingUserLocation();
    } else {
      stopFetchingUserLocation();
    }
  }, [_isScheduleLocationEnable, _listLocation]);

  const startScheduleNotification = useCallback(async () => {
    setIsScheduleNotificationEnable(true);
    BackgroundTimer.stopBackgroundTimer();

    try {
      BackgroundTimer.runBackgroundTimer(() => {
        setNotificationSecondLeft((secs: number) => {
          console.log('not moving', secs);
          if (secs > 0) {
            return secs - 1000;
          } else {
            return 0;
          }
        });
      }, 1000);
    } catch (e) {
      console.log('Error', e);
    }
  }, []);

  const stopScheduleNotification = async () => {
    setIsScheduleNotificationEnable(false);
    try {
      BackgroundTimer.stopBackgroundTimer();
    } catch (e) {
      console.log('Error', e);
    }
  };

  const startFetchingUserLocation = useCallback(() => {
    setIsScheduleLocationEnable(true);
    if (fetchLocationIntervalRef.current) {
      clearInterval(fetchLocationIntervalRef.current);
    }

    fetchLocationIntervalRef.current = setInterval(async () => {
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: DEFAULT_FETCH_LOCATION_TIMEOUT,
      });
      if (
        _listLocation.length > 0 &&
        location.latitude === _listLocation[0].lat &&
        location.longitude === _listLocation[0].long &&
        !_isDisabledNotificationPermission
      ) {
        if (!_isNotMoving) {
          startScheduleNotification();
        }
        setIsNotMoving(true);
      } else {
        setNotificationSecondLeft(_requestScheduleNotificationInterval);
        BackgroundTimer.stopBackgroundTimer();
      }

      const date = new Date(location.time);
      const formattedDate = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

      setListLocation([
        {
          id: location.time,
          lat: location.latitude,
          long: location.longitude,
          datetime: formattedDate,
          title: formattedDate,
        },
        ..._listLocation,
      ]);
    }, _requestLocationInterval);
  }, [
    _isNotMoving,
    _listLocation,
    _requestLocationInterval,
    _requestScheduleNotificationInterval,
    setListLocation,
    startScheduleNotification,
  ]);

  const stopFetchingUserLocation = async () => {
    setIsScheduleLocationEnable(false);
    if (fetchLocationIntervalRef.current) {
      clearInterval(fetchLocationIntervalRef.current);
    }
  };

  return useMemo(
    () => ({
      isScheduleLocationEnable: _isScheduleLocationEnable,
      notificationSecondLeft: _notificationSecondLeft,
      requestLocationInterval: _requestLocationInterval,
      setRequestLocationInterval,
      listLocation: _listLocation,
      isDisabledLocationPermission: _isDisabledLocationPermission,
      setListLocation: setListLocation,
      isScheduleNotificationEnable: _isScheduleNotificationEnable,
      startScheduleNotification,
      stopScheduleNotification,
      requestScheduleNotificationInterval: _requestScheduleNotificationInterval,
      setRequestScheduleNotificationInterval,
      isDisabledNotificationPermission: _isDisabledNotificationPermission,
      stopFetchingUserLocation,
      startFetchingUserLocation,
      isNotMoving: _isNotMoving,
    }),
    [
      _notificationSecondLeft,
      _isScheduleLocationEnable,
      _requestLocationInterval,
      setRequestLocationInterval,
      _listLocation,
      _isNotMoving,
      _isDisabledLocationPermission,
      setListLocation,
      _isScheduleNotificationEnable,
      _requestScheduleNotificationInterval,
      _isDisabledNotificationPermission,
      stopFetchingUserLocation,
      startFetchingUserLocation,
    ],
  );
}
