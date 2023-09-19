// function: return duration of visited video sections
function addVisitedSegments(
  visited_,
  prevTimeSec_,
  curTimeSec_,
  duration_,
  videoObj_
) {
  visited_.push({
    t1: Math.round(prevTimeSec_),
    t2: Math.round(curTimeSec_) + 1
  });
  const mergedSegments = mergeOverlapSegments(visited_);
  const mergedSegmentsInSeconds = mergedSegments.map((range) => ({
    t1: range.t1.diff(moment().startOf("day"), "seconds"),
    t2: range.t2.diff(moment().startOf("day"), "seconds")
  }));
  displayVisitedSegments(mergedSegmentsInSeconds, duration_, videoObj_);
  return {
    visited: visited_,
    mergedSegmentsInSeconds: mergedSegmentsInSeconds
  };
}
function displayVisitedSegments(visited_, duration_, videoObj_) {
  if (
    videoObj_.closest(".plyr").querySelector(".plyr__progress.display-visited")
  )
    videoObj_
      .closest(".plyr")
      .querySelector(".plyr__progress.display-visited")
      .remove();

  videoObj_
    .closest(".plyr")
    .querySelector(".plyr__progress")
    .insertAdjacentHTML(
      "afterend",
      '<div class="plyr__progress display-visited" style="margin-right: 0;"></div>'
    );
  let segmentsBar = videoObj_
      .closest(".plyr")
      .querySelector(".plyr__progress.display-visited"),
    w = (visited_[0]["t2"] * 100) / duration_,
    l = 0;
  segmentsBar.insertAdjacentHTML(
    "afterbegin",
    '<progress class="plyr__progress__buffer" value="100" min="0" max="100" style="left: 0; width: ' +
      w +
      '%;"></progress>'
  );
  if (visited_.length > 1) {
    for (let i = 1; i < visited_.length; i++) {
      l = (visited_[i]["t1"] * 100) / duration_;
      if (l < 100) w = (visited_[i]["t2"] * 100) / duration_ - l;
      else w = 100 - l;
      if (w > 0)
        segmentsBar.insertAdjacentHTML(
          "beforeend",
          '<progress class="plyr__progress__buffer" value="100" min="0" max="100" style="left: ' +
            l +
            "%; width: " +
            w +
            '%;"> </progress>'
        );
    }
  }
}
function storeVisitedSegments(vSrc, vVisited, vDur, videoObject, durObject) {
  let lhp = location.hostname + location.pathname + "/";
  if (videoObject) {
    // read object from LRS via State API and re-store sessionStorage
    for (let i = 0; i < videoObject.length; i++) {
      sessionStorage.setItem(
        Object.keys(videoObject[i])[0],
        Object.values(videoObject[i])[0]
      );
    }
    for (let i = 0; i < durObject.length; i++) {
      sessionStorage.setItem(
        Object.keys(durObject[i])[0],
        Object.values(durObject[i])[0]
      );
    }
  } else if (vVisited) {
    sessionStorage.setItem("video___" + lhp + vSrc, JSON.stringify(vVisited));
    sessionStorage.setItem("duration___" + lhp + vSrc, vDur);
  } else {
    let videos = [],
      durations = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      if (sessionStorage.key(i).includes("video___")) {
        videos.push({
          [sessionStorage.key(i)]: sessionStorage.getItem(sessionStorage.key(i))
        });
      }
      if (sessionStorage.key(i).includes("duration___")) {
        durations.push({
          [sessionStorage.key(i)]: sessionStorage.getItem(sessionStorage.key(i))
        });
      }
    }
    return { videos: videos, durations: durations };
  }
}
function mergeOverlapSegments(segments) {
  const formattedSegments = segments.map((segment) => ({
    t1: moment().startOf("day").add(segment.t1, "seconds"),
    t2: moment().startOf("day").add(segment.t2, "seconds")
  }));
  const mergedSegments = [];
  for (const segment of formattedSegments) {
    let hasOverlap = false;
    for (const mergedSegment of mergedSegments) {
      const mergedSegment_ = new Twix(mergedSegment.t1, mergedSegment.t2);
      const segment_ = new Twix(segment.t1, segment.t2);

      if (mergedSegment_.overlaps(segment_)) {
        hasOverlap = true;
        mergedSegment.t1 = moment.min(mergedSegment.t1, segment.t1);
        mergedSegment.t2 = moment.max(mergedSegment.t2, segment.t2);
        break;
      }
    }

    if (!hasOverlap) {
      mergedSegments.push({ t1: segment.t1, t2: segment.t2 });
    }
  }
  mergedSegments.sort(function (a, b) {
    return a.t1 - b.t1;
  });
  const joinedSegments = [];
  for (let i = 0; i < mergedSegments.length; i++) {
    const currentSegment = mergedSegments[i];
    if (i > 0 && currentSegment.t1.isSame(mergedSegments[i - 1].t2)) {
      mergedSegments[i - 1].t2 = currentSegment.t2;
    } else {
      joinedSegments.push(currentSegment);
    }
  }
  return joinedSegments;
}
// function: display visited video sections
function trackVideoEvents(videoObj, cExtentions) {
  if (typeof Twix === "undefined") {
    loadScript("twix.min.js", function () {
      tve(videoObj, cExtentions);
    });
  } else tve(videoObj, cExtentions);
  function tve(videoObj, cExtentions) {
    var observer,
      vSource,
      startVideo = "",
      prevTime = 0.0,
      preSeek = [0, 0, 0, 0, 0],
      preSeekPrev = 0.0,
      visited = [],
      seeked = false,
      vDuration = 0,
      progress = 0,
      result,
      videoType = "local";
    // get source of youtube or vimeo video object
    if (videoObj.src) {
      vSource = videoObj.src;
      if (vSource.includes("vimeo")) videoType = "vimeo";
      else if (vSource.includes("youtube")) videoType = "youtube";
      vSource = vSource.substring(0, vSource.indexOf("?"));
      // get source of local video object
    } else if (videoObj.querySelector("video source"))
      vSource = videoObj.querySelector("video source").src;
    cid = videoObj.closest("figure").id;
    let stmtObject = JSON.parse(sessionStorage.getItem("stmtObject")),
      lhp = location.hostname + location.pathname + "/";
    stmtObject.id += "/objectid/" + lhp;
    cmi5Controller.videos.push(stmtObject.id + vSource);
    let vKey = "video___" + lhp + vSource;
    let vDur = "duration___" + lhp + vSource;
    if (sessionStorage.getItem(vKey)) {
      visited = JSON.parse(sessionStorage.getItem(vKey));
      if (sessionStorage.getItem(vDur))
        vDuration = parseFloat(sessionStorage.getItem(vDur));
      const mergedSegments = mergeOverlapSegments(visited);
      const mergedSegmentsInSeconds = mergedSegments.map((range) => ({
        t1: range.t1.diff(moment().startOf("day"), "seconds"),
        t2: range.t2.diff(moment().startOf("day"), "seconds")
      }));
      displayVisitedSegments(mergedSegmentsInSeconds, vDuration, videoObj);
    }
    // add container vor echarts dashboard
    if (constStates.launchMode.toUpperCase() === "BROWSE") {
      videoObj
        .closest(".container")
        .insertAdjacentHTML(
          "beforeend",
          "<div id = 'container_" +
            cid +
            "' class = 'ec-canvas-wrapper' style='min-width: 100%; min-height: 40vh;'></div>"
        );
      echarts8("", "container_" + cid, "", vKey, "dark", videoObj);
    }
    observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (vSource) {
            if (vSource.includes("youtube")) {
              window.addEventListener(
                "message",
                onMessageReceivedYoutube,
                false
              );
              videoType = "youtube";
              cid = videoObj.closest("figure").id;
              sessionStorage.setItem("cid", cid);
              sessionStorage.setItem("vSource", vSource);
              videoObj.contentWindow.postMessage(
                JSON.stringify({
                  event: "command",
                  func: "seekTo",
                  args: [sessionStorage.getItem("youtubeCurrTime"), true]
                }),
                "*"
              );
              setTimeout(() => {
                videoObj.contentWindow.postMessage(
                  JSON.stringify({ event: "command", func: "pauseVideo" }),
                  "*"
                );
              }, 400);
            } else if (vSource.includes("vimeo")) {
              window.addEventListener("message", onMessageReceivedVimeo, false);
              videoType = "vimeo";
              cid = videoObj.closest("figure").id;
              sessionStorage.setItem("cid", cid);
              sessionStorage.setItem("vSource", vSource);
              videoObj.contentWindow.postMessage(
                {
                  method: "setCurrentTime",
                  value: sessionStorage.getItem("vimeoCurrTime")
                },
                "*"
              );
            } else {
              videoType = "local";
              cid = videoObj.closest("figure").id;
              sessionStorage.setItem("cid", cid);
              sessionStorage.setItem("vSource", vSource);
              videoObj.currentTime = sessionStorage.getItem("videoCurrTime");
            }
          }
          //console.log("added :" + vSource);
          return;
        }
        window.removeEventListener("message", onMessageReceivedYoutube, false);
        window.removeEventListener("message", onMessageReceivedVimeo, false);
        //console.log("removed :" + vSource);
        if (vSource) {
          if (vSource.includes("youtube"))
            videoObj.contentWindow.postMessage(
              '{"event":"command","func":"pauseVideo"}',
              "*"
            );
          else if (vSource.includes("vimeo"))
            videoObj.contentWindow.postMessage('{"method":"pause"}', "*");
          else videoObj.pause();

          if (typeof result !== "undefined")
            sendVideoStatement("ended", videoObj, result, cExtentions);
        }
      },
      {
        root: null,
        threshold: 0.9
      }
    );

    function sendPaused(curTime, duration, visited, progress, cx) {
      result = {
        extensions: {
          "https://w3id.org/xapi/video/extensions/current-time":
            Math.round(curTime),
          "https://w3id.org/xapi/video/extensions/duration": duration,
          "https://w3id.org/xapi/video/extensions/progress": progress,
          "https://w3id.org/xapi/video/extensions/played-segments":
            JSON.stringify(visited)
        }
      };
      cExtentions = { ...cExtentions, ...cx };
      if (progress < 1) {
        if (videoType === "youtube")
          sessionStorage.setItem("youtubeCurrTime", curTime);
        else if (videoType === "vimeo")
          sessionStorage.setItem("vimeoCurrTime", curTime);
        else sessionStorage.setItem("videoCurrTime", curTime);
        sendVideoStatement("paused", videoObj, result, cExtentions);
      } else sendVideoStatement("completed", videoObj, result, cExtentions);
    }

    function sendPlayed(curTime) {
      result = {
        extensions: {
          "https://w3id.org/xapi/video/extensions/current-time": curTime
        }
      };
      sendVideoStatement("played", videoObj, result, cExtentions);
    }

    function sendFinished(startVideo) {
      result = {
        score: {
          scaled: 1,
          min: 0,
          max: 100,
          raw: 100
        },
        success: true,
        completion: true,
        response: "",
        duration: ISO8601_time(startVideo)
      };
      sendVideoStatement("ended", videoObj, result, cExtentions);
    }

    function sendSeeked(prevTime, curTime) {
      result = {
        extensions: {
          "https://w3id.org/xapi/video/extensions/time-from": prevTime,
          "https://w3id.org/xapi/video/extensions/time-to": curTime
        }
      };
      sendVideoStatement("seeked", videoObj, result, cExtentions);
    }

    function onTimeupdate(e) {
      let ct;
      if (e.seconds) ct = e.seconds;
      else if (e.currentTime) ct = e.currentTime;
      else if (e.target) ct = e.target.currentTime;
      else return;
      preSeek.push(ct);
      if (preSeek.length > 5) preSeek.shift();
      let p3 = preSeek[3],
        p4 = preSeek[4];
      if (p4 > p3 + 1.5 || p4 < p3) onSeeked();
    }

    function onSeeked() {
      seeked = true;
      preSeekPrev = prevTime;
      prevTime = preSeek[3];
      sendSeeked(prevTime, preSeek[4]);
    }

    function onPlay(e) {
      prevTime = preSeek[4];
      seeked = false;
      if (e.duration) vDuration = Math.round(e.duration);
      else vDuration = Math.round(e.target.duration);
      if (startVideo !== null) {
        let DateTime = new Date();
        startVideo = DateTime.getTime();
      }
      sendPlayed(preSeek[4]);
    }

    function onPause(e) {
      let curTime_, cx, visited_;
      if (seeked) {
        curTime_ = prevTime;
        prevTime = preSeekPrev;
      } else curTime_ = preSeek[4];
      visited_ = addVisitedSegments(
        visited,
        prevTime,
        curTime_,
        vDuration,
        videoObj
      );
      visited = visited_.visited;
      for (let i = 0; i < visited_.mergedSegmentsInSeconds.length; i++) {
        progress +=
          visited_.mergedSegmentsInSeconds[i].t2 -
          visited_.mergedSegmentsInSeconds[i].t1;
      }
      progress = Math.round((progress / vDuration) * 100) / 100;
      storeVisitedSegments(vSource, visited, vDuration);
      if (!seeked) {
        if (e) {
          if (e.target) {
            cx = {
              "https://w3id.org/xapi/video/extensions/cid": cid,
              //"https://w3id.org/xapi/video/extensions/full-screen": videoObj.fullscreenchange,
              "https://w3id.org/xapi/video/extensions/title": videoObj.title,
              "https://w3id.org/xapi/video/extensions/length": Math.round(
                e.target.duration
              ),
              "https://w3id.org/xapi/video/extensions/full-screen":
                e.target.webkitDisplayingFullscreen,
              "https://w3id.org/xapi/video/extensions/video-playback-size":
                e.target.clientWidth + " x " + e.target.clientHeight,
              "https://w3id.org/xapi/video/extensions/speed":
                e.target.playbackRate,
              "https://w3id.org/xapi/video/extensions/volume": e.target.volume,
              "https://w3id.org/xapi/video/extensions/source": videoType,
              "https://w3id.org/xapi/video/extensions/video-playback-size":
                videoObj.clientWidth + " x " + videoObj.clientHeight
            };
          } else {
            cx = {
              "https://w3id.org/xapi/video/extensions/cid": cid,
              //"https://w3id.org/xapi/video/extensions/full-screen"
              "https://w3id.org/xapi/video/extensions/title": videoObj.title,
              "https://w3id.org/xapi/video/extensions/length": Math.round(
                e.duration
              ),
              "https://w3id.org/xapi/video/extensions/source": videoType
            };
          }
        }
        sendPaused(curTime_, vDuration, visited, progress, cx);
      }
      seeked = false;
    }

    function onEnded() {
      return; //sendFinished(startVideo);
    }

    function ISO8601_time(start) {
      let currentTime = new Date();
      return (
        "PT" + Math.round(currentTime.getTime() / 1000 - start / 1000) + "S"
      );
    }

    if (vSource && vSource.includes("vimeo")) {
      // Listen for messages from the player
      window.addEventListener("message", onMessageReceivedVimeo, false);
      observer.observe(videoObj.closest(".plyr"));
      // Handle messages received from the player
      function onMessageReceivedVimeo(event) {
        var data = event.data;
        switch (data.event) {
          case "pause":
            onPause(data.data);
            break;
          case "ended":
            onEnded(data.data);
            break;
          case "play":
            onPlay(data.data);
            break;
          case "timeupdate":
            onTimeupdate(data.data);
            break;
        }
      }
      return;
    }

    if (vSource && vSource.includes("fileadmin")) {
      observer.observe(videoObj.closest(".plyr"));
      videoObj.addEventListener("timeupdate", onTimeupdate);
      videoObj.addEventListener("pause", onPause);
      videoObj.addEventListener("play", onPlay);
      videoObj.addEventListener("ended", onEnded);
    }

    if (vSource && vSource.includes("youtube")) {
      /*if (vSource.indexOf("-nocookie") != -1) {
       videoObj.src = videoObj.src.replace("-nocookie", "");
       videoObj.src = videoObj.src.replace("&origin=https%3A%2F%2Fcms2.cmifive.io", "");
    }*/
      // Listen for messages from the player
      window.addEventListener("message", onMessageReceivedYoutube, false);
      observer.observe(videoObj.closest(".plyr"));
      // Handle messages received from the player
      function onMessageReceivedYoutube(event) {
        let data = JSON.parse(event.data);
        if (data.hasOwnProperty("info")) {
          if (data.info) {
            if (data.info.hasOwnProperty("muted")) return;
            if (data.info.hasOwnProperty("playerState")) {
              switch (data.info.playerState) {
                case 2:
                  onPause(data.info);
                  break;
                case 0:
                  onEnded(data.info);
                  break;
                case 1:
                  onPlay(data.info);
                  break;
              }
            } else onTimeupdate(data.info);
          }
        }
      }
      return;
    }
  }
}
// function: generate and send video statements
function sendVideoStatement(verbName, videoObj, result, cExtentions) {
  // Which verb is to be sent?
  let verbUpper = verbName.toUpperCase(),
    verb,
    videoSrc,
    videoSrcPath;
  if (videoObj.src) {
    videoSrc = videoObj.src;
    videoSrc = videoSrc.substring(0, videoSrc.indexOf("?"));
    videoSrcPath = videoSrc;
  } else if (videoObj.querySelector("video source")) {
    videoSrc = videoObj.querySelector("video source").src;
    videoSrcPath = videoSrc;
    videoSrc = videoSrc.substring(videoSrc.lastIndexOf("/") + 1);
  }
  switch (verbUpper) {
    case "SEEKED":
      verb = ADL.verbs.seeked;
      break;
    case "PAUSED":
      verb = ADL.verbs.paused;
      break;
    case "PLAYED":
      verb = ADL.verbs.played;
      break;
    case "INTERACTED":
      verb = ADL.verbs.initeracted;
      break;
    case "EXPERIENCED":
      verb = ADL.verbs.experienced;
      break;
    case "INITIALIZED":
      verb = ADL.verbs.initialized;
      break;
    case "COMPLETED":
      verb = ADL.verbs.completed;
      break;
    case "ENDED":
      verb = ADL.verbs.ended;
      break;
  }
  if (constStates.launchMode.toUpperCase() !== "NORMAL") {
    // Only initialized and terminated are allowed per section 10.0 of the spec.
    console.log(
      "When launchMode is " +
        constStates.launchMode +
        ", only Initialized and Terminated verbs are allowed"
    );
    return false;
  }
  if (verb) {
    // Context extensions were read from the State document's context template
    let stmt,
      cx,
      vObj = [],
      stmtObject = JSON.parse(sessionStorage.getItem("stmtObject")),
      stmtObjectParent = JSON.parse(sessionStorage.getItem("stmtObject")),
      lhp = location.hostname + location.pathname + "/";
    // Get basic cmi5 defined statement object
    stmtObject.id += "/objectid/" + lhp;
    vObj = {
      id: stmtObject.id + videoSrcPath,
      objectType: "Activity",
      definition: {
        type: "https://w3id.org/xapi/video/activity-type/video",
        name: {
          "en-US": videoSrc
        }
      }
    };
    cx = {
      "https://w3id.org/xapi/video/extensions/screen-size":
        window.innerWidth + " x " + window.innerHeight,
      "https://w3id.org/xapi/video/extensions/user-agent": navigator.userAgent,
      "https://w3id.org/xapi/acrossx/activities/page": location.pathname
      //"https://w3id.org/xapi/video/extensions/completion-threshold": "1.0"
    };
    stmt = cmi5Controller.getcmi5AllowedStatement(
      verb,
      vObj,
      cmi5Controller.getContextActivities(),
      cx
    );
    stmt.context.contextActivities.parent = [
      {
        id: (stmtObjectParent.id += "/parentid/" + lhp),
        definition: {
          name: {
            [cmi5Controller.dLang]:
              cmi5Controller.dTitle +
              " at page " +
              '"' +
              handleStates.pageTitle +
              '"'
          },
          type: "http://id.tincanapi.com/activitytype/page"
        },
        objectType: "Activity"
      }
    ];
    stmt.context.contextActivities.grouping[0].id = JSON.parse(
      sessionStorage.getItem("stmtObject")
    ).id;
    stmt.context.extensions = { ...cExtentions, ...cx };
    stmt.object.definition.name = {
      [cmi5Controller.dLang]:
        cmi5Controller.dTitle +
        ': "' +
        videoSrc +
        '"' +
        " at page " +
        '"' +
        handleStates.pageTitle +
        '"'
    };
    stmt.result = {} = result;
    // Add UTC timestamp, required by cmi5 spec.
    stmt.timestamp = new Date().toISOString();
    //console.log(stmt);
    if (verbUpper === "ENDED") {
      sessionStorage.setItem(
        "latestvideostatement___" +
          videoSrcPath.substring(videoSrcPath.lastIndexOf("/") + 1),
        JSON.stringify(stmt)
      );
    } else cmi5Controller.stmts.push(stmt);
    sessionStorage.setItem(
      "videostatements",
      JSON.stringify(cmi5Controller.stmts)
    );
  } else console.log("Invalid verb passed: " + verbName);

  return false;
}
function handleVideoStatements() {
  let vimeoOrYt = document.querySelectorAll(".video iframe"),
    localVideo = document.querySelectorAll(".video video"),
    context = cmi5Controller.getContextExtensions();
  cmi5Controller.stmts = [];
  cmi5Controller.videos = [];

  if (sessionStorage.getItem("videostatements")) {
    let vStmts = JSON.parse(sessionStorage.getItem("videostatements"));
    for (let i = 0; i < sessionStorage.length; i++) {
      if (sessionStorage.key(i).includes("latestvideostatement")) {
        vStmts.push(JSON.parse(sessionStorage.getItem(sessionStorage.key(i))));
        sessionStorage.removeItem(sessionStorage.key(i));
      }
    }
    sessionStorage.removeItem("videostatements");
    cmi5Controller.sendStatements(vStmts);
    //sessionStorage.removeItem("latestvideostatement");
  }

  if (vimeoOrYt.length > 0) {
    let yvPlayer = [];
    for (let i = 0; i < vimeoOrYt.length; i++) {
      vimeoOrYt[i].setAttribute("playsinline", "1");
      yvPlayer[i] = new Plyr(vimeoOrYt[i].parentNode, {
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: false,
          container: null
        },
        previewThumbnails: { enabled: false, src: "" },
        captions: { active: true },
        youtube: {
          noCookie: false,
          rel: 0,
          autoplay: 0,
          playsinline: 1,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          widget_referrer: ""
        },
        hideControls: false,
        playsinline: true,
        blankVideo: "https://cdn.plyr.io/static/blank.mp4"
      });
      yvPlayer[i].on("ready", (event) => {
        if (yvPlayer[i].embed) {
          if (yvPlayer[i].embed.g)
            trackVideoEvents(yvPlayer[i].embed.g, context);
          else trackVideoEvents(yvPlayer[i].embed.element, context);
        }
      });
    }
  }
  if (localVideo.length > 0) {
    let lPlayer = [];
    for (let i = 0; i < localVideo.length; i++) {
      localVideo[i].setAttribute("playsinline", "");
      lPlayer[i] = new Plyr(localVideo[i], {
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: false,
          container: null
        },
        captions: { active: true },
        hideControls: false,
        playsinline: true
      });
      lPlayer[i].on("ready", (event) => {
        trackVideoEvents(lPlayer[i].media, context);
      });
    }
  }
}
