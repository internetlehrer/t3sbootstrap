// function: Wer hat welche H5P-Interaktionen mit welchem Erfolg bearbeitet?

function echarts4_(event, container, page, mode, h5pObj) {
  const data = getStatementsSelection("answered", page);
  if (typeof data !== "undefined") echartSetup(container, data, mode, h5pObj);
  else {
    userAlerts("nodatamodal");
    return;
  }
}

// function: get success of answered statements
function getStatementsSelection(verb, page, echartQuery) {
  let stmtsCached = false,
    sel;
  if (sessionStorage.getItem("stmtsCached") === "true") stmtsCached = true;
  sel = new ADL.Collection(
    getDashboardStatements(cmi5Controller.activityId, stmtsCached, true, true)
  );
  sel
    .where(
      "actor.account != 'undefined' and result.score != 'undefined' and verb.id = 'http://adlnet.gov/expapi/verbs/" +
        verb +
        "'"
    )
    .exec(function (data) {
      for (var i = 0; i < data.length; i++) {
        data[i]["name"] = data[i].actor.account.name;
        data[i]["object"] = data[i].object.id;
        data[i]["duration"] = moment
          .duration(data[i].result.duration)
          .asMilliseconds();
        data[i]["scaled"] = data[i].result.score.scaled;
        data[i]["success"] = data[i].result.success;
        delete data[i].version;
        delete data[i].actor;
        delete data[i].stored;
        delete data[i].authority;
        delete data[i].context;
        delete data[i].result;
        delete data[i].verb;
        delete data[i].actor;
        delete data[i].id;
      }
      //console.log(data);
      return data;
    });
  //console.log(sel.contents);
  return sel.contents;
}

// function: draw echart
function echartSetup(container, data_, mode, h5pObj) {
  if (document.getElementById(container))
    container = document.getElementById(container);
  if (sessionStorage.getItem("cmi5No") === "false") {
    let myChart = echarts.init(container, mode),
      option,
      series = [],
      pieData = [],
      color,
      success = { true: 0, false: 0 },
      users = [],
      objectLabels = [],
      objects = [],
      selScaled = new ADL.Collection(data_),
      selUsers = new ADL.Collection(data_),
      kk = 0;

    selScaled
      .groupBy("object")
      .groupBy("name")
      .max("scaled", 1)
      .sum("duration", 1);
    selScaled = selScaled.contents;
    selUsers.groupBy("name").count().select("group as users", "count");
    selUsers = selUsers.contents;
    let ssl = selScaled.length;

    for (let k = 0, o; k < ssl; k++) {
      o = selScaled[k].group;
      objects[k] = o.substring(
        o.indexOf("h5pcid_") + 7,
        o.indexOf("/", o.indexOf("h5pcid_"))
      );
      if (
        mode === "dark" &&
        h5pObj &&
        objects[k] === h5pObj.id.split("h5p-iframe-")[1]
      ) {
        kk = k;
        ssl = k + 1;
      }
    }
    if (mode === "dark") {
      let o = objects[kk];
      objects = [];
      objects[0] = o;
    }
    for (let i = 0, scaled, dur; i < selUsers.length; i++) {
      users[i] = "User " + (i + 1);
      scaled = [];
      dur = [];
      objectLabels.push("User " + (i + 1));
      for (let k = kk; k < ssl; k++) {
        // pusch object names to objects
        dur[k - kk] = null;
        scaled[k - kk] = null;
        for (let u = 0; u < selScaled[k].data.length; u++) {
          if (selScaled[k].data[u].group === selUsers[i].users) {
            if (mode !== "dark") {
              // summarize success count for pie chart
              if (selScaled[k].data[u].max === 1) success.true++;
              else success.false++;
            }
            // set scaled and duration for bar chart
            scaled[k - kk] = selScaled[k].data[u].max.toFixed(1);
            dur[k - kk] = moment
              .duration(selScaled[k].data[u].sum)
              .as("minutes")
              .toFixed(1);
          }
        }
      }
      if (success.false === 0) success.false = null;
      if (success.true === 0) success.true = null;
      var rcolor_ = colorList[i];
      series.push({
        name: users[i],
        type: "bar",
        emphasis: {
          focus: "series"
        },
        itemStyle: {
          color: rcolor_
        },
        //stack: Object.keys(freqUsers)[j],
        //barWidth: "33%",
        data: scaled
      });
      series.push({
        name: users[i] + " d",
        type: "bar",
        emphasis: {
          focus: "series"
        },
        itemStyle: {
          borderWidth: 0,
          borderColor: "white",
          borderType: "solid",
          color: rcolor_ + "66"
        },
        //stack: Object.keys(freqUsers)[j],
        barGap: 0,
        barWidth: "5%",
        data: dur
      });
    }
    if (mode !== "dark") {
      for (let i = 0; i < Object.keys(success).length; i++) {
        if (Object.keys(success)[i] === "false") color = "#E74E54";
        else color = "#80C462";
        pieData.push({
          value: Object.values(success)[i],
          name: Object.keys(success)[i],
          itemStyle: {
            color: color
          }
        });
      }
      series.push({
        name: "Objects",
        type: "pie",
        radius: [0, 70],
        center: ["87%", "27%"],
        itemStyle: {
          borderRadius: 5
        },
        label: {
          show: true
        },
        emphasis: {
          label: {
            show: true
          }
        },
        data: pieData
      });
    }
    let title =
      "Wer hat welche H5P-Interaktionen mit welchem Erfolg bearbeitet?";
    if (mode === "dark")
      title = "Wer hat diese H5P-Interaktionen mit welchem Erfolg bearbeitet?";
    option = {
      title: {
        text: title,
        left: ""
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: "false"
          },
          dataView: {
            readOnly: false
          },
          magicType: {
            type: ["stack"]
          },
          restore: {},
          saveAsImage: {}
        }
      },
      legend: {
        orient: "vertical",
        left: "75%",
        top: "48%",
        type: "scroll",
        data: objectLabels
      },
      tooltip: {
        //trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      grid: {
        left: "3%",
        right: "27%",
        bottom: "3%",
        top: "12%",
        containLabel: true
      },
      xAxis: [
        {
          type: "category",
          data: objects,
          //minInterval: 1,
          axisTick: {
            alignWithLabel: true
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          minInterval: ""
        }
      ],
      series: series
    };
    if (option && typeof option === "object") {
      myChart.setOption(option);
    }
    sessionStorage.setItem(
      "_echarts_instance_",
      document.getElementById("container2").getAttribute("_echarts_instance_")
    );
    document.querySelector(".spinner-border").style.display = "none";
    setTimeout(() => {
      let resizeEvent = new Event("resize");
      window.dispatchEvent(resizeEvent);
    }, 0);
    window.addEventListener("resize", myChart.resize);

    myChart.on("click", function (params) {
      xMouseDown = true;
      for (let k = 0, o; k < selScaled.length; k++) {
        o = selScaled[k].group;
        if (o.includes(params.name) && o.includes("objectid/")) {
          s =
            "https://" +
            o.substring(
              o.indexOf("objectid/") + "objectid/".length,
              o.indexOf("/h5pcid_", o.indexOf("objectid/"))
            );
          location.href =
            s +
            "?" +
            constStates.cmi5Parms +
            "#h5p-iframe-" +
            o.substring(
              o.indexOf("h5pcid_") + "h5pcid_".length,
              o.indexOf("/", o.indexOf("h5pcid_"))
            );
        }
      }
    });
  }
}
