const config = {
    server: {
        secret: 'qwertyuiop[poiuytrewqwertyuiolmnbvftyhbvcrtyhjm,'
    },
    rtmp_server: {
        rtmp: {
            port: 1935,
            chunk_size: 60000,
            gop_cache: true,
            ping: 60,
            ping_timeout: 30
        },
        http: {
            port: 8888,
            mediaroot: './server/media',
            allow_origin: '*'
        },
        trans: {
            ffmpeg: 'C:/Users/Movavi_School.DESKTOP-O1T25EP/Desktop/ffmpeg-4.0.2/bin/ffmpeg.exe',
            tasks: {
                    app: 'live',
                    hls: true,
                    hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                    dash: true,
                    dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
            },
        },
    },
}

module.exports = config