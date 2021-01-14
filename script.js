const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

let load = async () => {
    await ffmpeg.load();
}

function toHexString(byteArray) {
    return byteArray.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');
}
let getTypedArray = (hex) => {
    return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) { return parseInt(h, 16) }));
}
let replaceBytes = (hex) => {
    return hex.replace(/(2ad7b1.*?4489)([\dA-Fa-f]{12})/, '$18840B07D8000')
}
let file_;
let ratio_ = 0;

document.getElementById("numThreads").innerHTML = `<font style="color:red;font-weight:bold;">${window.navigator.hardwareConcurrency}</font>`;
ffmpeg.setProgress(({ ratio }) => {
    $("#loadingConvert").removeClass("hidden");
    transitionThrough(ratio_, ratio);
    // $("#loadingBar").css("transform", `translate(calc(-${100 * (1 - ratio)}% - 2px), -2px)`);
    ratio_ = ratio;
});

const transitionThrough = (ratio_, ratio) => {
    let i = 0;
    let lerp = (i) => { return i / 40.0 }
    let v = setInterval(() => {
        let r = ratio_ + (ratio - ratio_) * lerp(i);
        $("#loadingBar").css("transform", `translate(calc(-${100 * (1 - r)}% - 2px), -2px)`);
        i++;
        if (i == 40) {
            clearInterval(v);
        }
    }, 10);
}

$(async () => {
    await load();
    const transcode = async ({ target: { files } }) => {
        const { name } = files[0];
        ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
        await ffmpeg.run('-i', name, '-c:v', 'libvpx', '-speed', '1', '-threads', "" + window.navigator.hardwareConcurrency, '-cpu-used', "" + window.navigator.hardwareConcurrency, 'output.webm');
        const data = ffmpeg.FS('readFile', 'output.webm');
        const file = new Blob([data.buffer], { type: 'video/webm' });
        file_ = file;
        $('#download-convert').show();
        document.getElementById("download-convert").href = URL.createObjectURL(file);
    }
    const editCode = async ({ target: { files } }) => {
        const { name } = files[0];
        ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
        const data = ffmpeg.FS('readFile', name);
        const file = new Blob([getTypedArray(replaceBytes(toHexString(data))).buffer], { type: 'video/webm' });
        $('#download-resize').show();
        let url = URL.createObjectURL(file);
        document.getElementById("download-resize").href = url;
        // setTimeout(() => { URL.revokeObjectURL(url) }, 600000);
    }
    const piper = async () => {
        let buff = await file_.arrayBuffer();
        const file = new Blob([getTypedArray(replaceBytes(toHexString(new Uint8Array(buff)))).buffer], { type: 'video/webm' });
        $('#download-resize').show();
        document.getElementById("download-resize").href = URL.createObjectURL(file);
    }

    const elm = document.getElementById('uploader');
    const elm2 = document.getElementById('converter');
    const elm3 = document.getElementById('piper');
    elm.addEventListener('change', (data) => { transcode(data) });
    elm2.addEventListener('change', (data) => { editCode(data) });
    elm3.addEventListener('click', (data) => { piper() });
});