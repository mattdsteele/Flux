let dom = {
    hrbConnectionScreen: {
        switchBtn:     document.querySelector('#hrb-connection-screen .switch'),
        indicator:     document.querySelector('#hrb-connection-screen .indicator'),
        startBtn:      document.querySelector('#hrb-connection-screen .start-notifications'),
        stopBtn:       document.querySelector('#hrb-connection-screen .stop-notifications'),
    },
    controllableConnectionScreen: {
        switchBtn:     document.querySelector('#flux-connection-screen .switch'),
        indicator:     document.querySelector('#flux-connection-screen .indicator'),
        startBtn:      document.querySelector('#flux-connection-screen .start-notifications'),
        stopBtn:       document.querySelector('#flux-connection-screen .stop-notifications'),
    },
    datascreen: {
        time:      document.querySelector('#time'),
        interval:   document.querySelector('#interval-time'),
        targetPwr: document.querySelector('#target-power'),
        power:     document.querySelector('#power'),
        cadence:   document.querySelector('#cadence'),
        speed:     document.querySelector('#speed'),
        heartRate: document.querySelector('#heart-rate')
    },
    controlscreen: {
        watch: {
            start:  document.querySelector('#watch-start'),
            pause:  document.querySelector('#watch-pause'),
            resume: document.querySelector('#watch-resume'),
            lap:    document.querySelector('#watch-lap'),
            stop:   document.querySelector('#watch-stop'),
        },
        darkMode:    document.querySelector('#dark-mode'),
        theme:       document.querySelector('#theme'),
        targetPower: document.querySelector('#target-power-value'),
        workPower:   document.querySelector('#work-power-value'),
        restPower:   document.querySelector('#rest-power-value'),
        setTargetPower:    document.querySelector('#set-target-power'),
        startWorkInterval: document.querySelector('#start-work-interval'),
        startRestInterval: document.querySelector('#start-rest-interval'),
        laps: document.querySelector('#laps'),
        startWorkout: document.querySelector('#start-workout'),
    },
    file: {
        fileBtn: document.querySelector('#workout-file'),
    },
    graphHr: {
        cont:  document.querySelector('#graph-hr'),
        graph: document.querySelector('#graph-hr .graph')
    },
    graphPower: {
        cont:  document.querySelector('#graph-power'),
        graph: document.querySelector('#graph-power .graph')
    }
};

export { dom };
