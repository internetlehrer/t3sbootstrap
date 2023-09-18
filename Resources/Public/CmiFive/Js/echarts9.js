function echarts9_(event, container, page, echartQuery) {
  const data = getStatementsSelection("ended", page, echartQuery);
  if (typeof data !== "undefined") echartSetup(container, data, echartQuery);
  else {
    userAlerts("nodatamodal");
    return;
  }
}
// function: LRS query on success score of H5P interaction at page "page"
function getStatementsSelection(verb, page, echartQuery) {
  let videoActivityIds = [],
    dashboardDataS = [],
    dashboardDataD = [],
    dashboardDataT = [],
    dashboardDataC = [],
    users = [],
    stmtsCached = false;
  for (let i = 0; i < sessionStorage.length; i++) {
    if (sessionStorage.key(i).includes("video___")) {
      videoActivityIds.push(
        JSON.parse(constStates.stmtObject).id +
          "/objectid/" +
          sessionStorage.key(i).substring(8, sessionStorage.key(i).length)
      );
    }
  }
  if (sessionStorage.getItem("stmtsCached") === "true") stmtsCached = true;
  let stmts = getDashboardStatements(
    cmi5Controller.activityId,
    stmtsCached,
    true,
    true
  );
  for (let i = 0; i < videoActivityIds.length; i++) {
    let sel = new ADL.Collection(stmts);
    sel
      .where(
        "actor.account != 'undefined' and object.id = '" +
          videoActivityIds[i] +
          "' and result.extensions[https://w3id.org/xapi/video/extensions/current-time] > 0 and verb.id = 'https://w3id.org/xapi/video/verbs/" +
          verb +
          "'"
      )
      .groupBy("actor.account.name")
      .count(
        "result.extensions[https://w3id.org/xapi/video/extensions/progress]"
      );
    sel = sel.contents;
    let segments = [],
      cid,
      duration,
      title;

    duration =
      sel[0].data[sel[0].count - 1].result.extensions[
        "https://w3id.org/xapi/video/extensions/duration"
      ];
    for (let i = 0; i < sel.length; i++) {
      if (
        typeof sel[i].data[sel[i].count - 1].context.extensions[
          "https://w3id.org/xapi/video/extensions/cid"
        ] !== undefined
      ) {
        cid =
          sel[i].data[sel[i].count - 1].context.extensions[
            "https://w3id.org/xapi/video/extensions/cid"
          ];
      }

      if (
        typeof sel[i].data[sel[i].count - 1].context.extensions[
          "https://w3id.org/xapi/video/extensions/title"
        ] !== undefined
      )
        title =
          sel[i].data[sel[i].count - 1].context.extensions[
            "https://w3id.org/xapi/video/extensions/title"
          ];
      if (
        sel[i].data[sel[i].count - 1].result.extensions[
          "https://w3id.org/xapi/video/extensions/played-segments"
        ] !== undefined
      )
        segments = [
          ...segments,
          ...JSON.parse(
            sel[i].data[sel[i].count - 1].result.extensions[
              "https://w3id.org/xapi/video/extensions/played-segments"
            ]
          )
        ];
    }
    users.push(sel.length);
    dashboardDataS.push(segments);
    dashboardDataD.push(duration);
    dashboardDataT.push(title);
    dashboardDataC.push({ [videoActivityIds[i]]: cid });
  }
  return {
    dashboardDataS: dashboardDataS,
    dashboardDataD: dashboardDataD,
    dashboardDataT: dashboardDataT,
    dashboardDataC: dashboardDataC,
    videoActivityIds: videoActivityIds,
    users: users
  };
}
function echartSetup(container, data_, temp) {
  if (document.getElementById(container))
    container = document.getElementById(container);
  if (constStates.cmi5No === "false") {
    let myChart = echarts.init(container);
    var seriesData = [],
      xAxis = [],
      yAxis = [],
      legend = [],
      ids = [],
      cids = [],
      grid = [],
      title = [];
    for (let v = 0; v < data_.dashboardDataS.length; v++) {
      var userSegmentUsage = {},
        xAxisData = [],
        segementsData = data_.dashboardDataS[v],
        videoLength = data_.dashboardDataD[v],
        videoName = data_.dashboardDataT[v],
        cid = data_.dashboardDataC[v][data_.videoActivityIds[v]];

      // Sort the combined data by t1 value
      segementsData.sort((a, b) => a.t1 - b.t1);

      segementsData.forEach((segment) => {
        const segmentStart = Math.floor(segment.t1);
        const segmentEnd = Math.ceil(segment.t2);

        for (let j = segmentStart; j <= segmentEnd; j += 1) {
          if (!userSegmentUsage[j]) {
            userSegmentUsage[j] = [];
          }
          userSegmentUsage[j].push(segment);
        }
      });
      ids.push(data_.videoActivityIds[v]);
      cids.push(cid);
      const usageStatistics = [];
      for (let i = 0; i <= videoLength; i++) {
        const segments = userSegmentUsage[i] || [];
        let totalUsage = segments.length;
        if (data_.users[v] > 1) totalUsage = totalUsage;

        const usageDurations = segments.map(
          (segment) => segment.t2 - segment.t1
        );
        const meanUsage =
          totalUsage > 0
            ? usageDurations.reduce((sum, duration) => sum + duration, 0) /
              totalUsage
            : 0;
        const medianUsage =
          totalUsage > 0 ? usageDurations[Math.floor(totalUsage / 2)] : 0;
        usageStatistics.push({
          timestamp: i,
          totalUsage,
          meanUsage,
          medianUsage
        });
        if (i === 2) {
          usageStatistics[0].totalUsage = usageStatistics[2].totalUsage;
          usageStatistics[1].totalUsage = usageStatistics[2].totalUsage;
        }
      }

      xAxisData = usageStatistics.map((data) => data.timestamp);
      seriesData.push({
        xAxisIndex: v,
        yAxisIndex: v,
        name: "Mittlere Häufigkeit",
        type: "bar",
        itemStyle: {
          //color: colorList[v]
        },
        data: usageStatistics.map((data) => data.totalUsage)
      }) /* ,
        {
          name: "Mean Usage",
          type: "bar",
          data: usageStatistics.map((data) => data.meanUsage)
        },
        {
          name: "Median Usage",
          type: "bar",
          data: usageStatistics.map((data) => data.medianUsage)
        } */;
      title.push({
        top: v * 32 + 6 + "%",
        left: "4.75%",
        textStyle: { fontSize: 12, fontWeight: "normal" },
        text: "Video: " + videoName.substring(videoName.lastIndexOf("/") + 1)
      });
      /* for (let i = 0; i < segementsData.length; i++) {
        userSegments.push({
          user: "User " + (i + 1),
          segments: segementsData[i]
        });
      } */
      //legend = { data: [...new Set(userSegments.map(({ user }) => user))] };
      grid.push({
        left: "7%",
        top: v * 32 + 12 + "%",
        width: "85%",
        height: "20%"
      });
      /* xAxisData = Array.from(
        { length: Math.ceil(videoLength / 1) },
        (_, i) => i * 1
      ); */
      xAxis.push({
        type: "category",
        data: xAxisData,
        gridIndex: v,
        name: "Sekunden"
      });
      yAxis.push({
        type: "value",
        gridIndex: v
      });
    }
    // ECharts options
    const options = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      toolbox: {
        show: false,
        feature: {
          restore: {},
          saveAsImage: {}
        }
      },
      grid: grid,
      //legend: legend,
      title: title,
      xAxis: xAxis,
      yAxis: yAxis,
      graphic: [
        {
          type: "group",
          left: "center",
          top: 0,
          children: [
            {
              type: "rect",
              z: 100,
              left: "center",
              top: "middle",
              shape: {
                width: 500,
                height: 30
              },
              style: {
                fill: "#fff"
                //stroke: "#555",
                //lineWidth: 1,
                //shadowBlur: 8,
                //shadowOffsetX: 3,
                //shadowOffsetY: 3,
                //shadowColor: "rgba(0,0,0,0.2)"
              }
            },
            {
              type: "text",
              z: 100,
              left: "center",
              top: "middle",
              style: {
                fill: "#333",
                width: 400,
                overflow: "break",
                text: "Mittelwert besichtigter Segmente in Videos",
                font: "18px Calibri"
              }
            }
          ]
        }
      ],
      series: seriesData
    };
    /* const options = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      legend: {
        data: ["Total Usage", "Mean Usage", "Median Usage"]
      },
      xAxis: {
        type: "category",
        data: xAxisData
      },
      yAxis: {
        type: "value"
      },
      series: seriesData
    }; */
    if (options && typeof options === "object") myChart.setOption(options);

    myChart.on("click", function (params) {
      let id_ = ids[params.seriesIndex],
        cid_ = cids[params.seriesIndex];
      if (id_.includes("vimeo"))
        sessionStorage.setItem("vimeoCurrTime", params.dataIndex);
      else if (id_.includes("youtube"))
        sessionStorage.setItem("youtubeCurrTime", params.dataIndex);
      else sessionStorage.setItem("videoCurrTime", params.dataIndex);
      if (id_.includes("objectid/")) {
        xMouseDown = true;
        let path =
          "https://" +
          id_.substring(
            id_.indexOf("objectid/") + "objectid/".length,
            id_.indexOf("/https://")
          );
        location.href =
          path + "?" + sessionStorage.getItem("cmi5Parms") + "#" + cid_;
        document.querySelector("#canvasModal .btn-close").click();
      }
      /* var option = this.getOption();
      if (params.componentType === "graphic") {
        if (click) {
          for (let i = 0; i < option.series.length; i++) {
            option.series[i].stack = "Video " + option.series[i].xAxisIndex;
            option.color = [
              "black",
              "black",
              "black",
              "black",
              "black",
              "black"
            ];
          }
          click = false;
        } else {
          for (let i = 0; i < option.series.length; i++) {
            delete option.series[i].stack;
            option.color = [
              "#5470c6",
              "#91cc75",
              "#fac858",
              "#ee6666",
              "#73c0de",
              "#3ba272",
              "#fc8452",
              "#9a60b4",
              "#ea7ccc"
            ];
          }
          click = true;
        }
        this.setOption(
          { series: option.series, color: option.color },
          { replaceMerge: "series" }
        );
      } */
    });

    /* sessionStorage.setItem(
      "_echarts_instance_",
      document.getElementById("container2").getAttribute("_echarts_instance_")
    ); */
    if (document.querySelector(".spinner-border"))
      document.querySelector(".spinner-border").style.display = "none";
    window.addEventListener("resize", function (event) {
      myChart.resize();
    });
  }
}
