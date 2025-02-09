/**
 * treeRenderer.js
 *
 * renderTree(treeData, container)
 *   - treeData  : buildTreeForItem() で生成した階層データ
 *   - container : ツリー描画先のDOM要素（ここでは #svgContainer）
 */
function renderTree(treeData, container) {
  const margin = { top: 20, right: 90, bottom: 30, left: 90 };
  const width = window.innerWidth - margin.left - margin.right;
  const height = window.innerHeight - margin.top - margin.bottom;
  
  // SVG要素の生成（ズーム＆パン対応）
  const svg = d3.select(container)
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .call(
        d3.zoom()
          .scaleExtent([0.5, 2])
          .on("zoom", (event) => {
            g.attr("transform", event.transform);
          })
      )
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  // ドロップシャドウフィルターの定義
  const defs = svg.append("defs");
  const filter = defs.append("filter")
    .attr("id", "dropShadow")
    .attr("height", "130%");
  filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 3)
    .attr("result", "blur");
  filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 2)
    .attr("dy", 2)
    .attr("result", "offsetBlur");
  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode")
    .attr("in", "offsetBlur");
  feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");
  
  // ズーム設定
  const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });
  const svgSelection = d3.select(container).select("svg")
    .call(zoom);
  
  const g = svg;
  
  // 固定ノードサイズでのツリー・レイアウト
  const treemap = d3.tree().nodeSize([80, 200]);
  const root = d3.hierarchy(treeData, d => d.children);
  treemap(root);
  
  // 全体の範囲を算出してフィットする変換を計算
  const xExtent = d3.extent(root.descendants(), d => d.x);
  const yExtent = d3.extent(root.descendants(), d => d.y);
  const treeWidth = yExtent[1] - yExtent[0];
  const treeHeight = xExtent[1] - xExtent[0];
  const scale = Math.min(width / treeWidth, height / treeHeight);
  const translateX = (width - treeWidth * scale) / 2 - yExtent[0] * scale;
  const translateY = (height - treeHeight * scale) / 2 - xExtent[0] * scale;
  const initialTransform = d3.zoomIdentity
    .translate(translateX + margin.left, translateY + margin.top)
    .scale(scale);
  svgSelection.call(zoom.transform, initialTransform);
  
  // リンクの描画
  g.selectAll(".link")
    .data(root.links())
    .enter()
    .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);
  
  // ノードの描画
  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter()
    .append("g")
      .attr("class", "node")
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")");
  
  // ノード（四角形）の描画
  node.append("rect")
    .attr("width", d => d.data.type === "equipment" ? 200 : 150)
    .attr("height", d => d.data.type === "equipment" ? 70 : 50)
    .attr("x", d => d.data.type === "equipment" ? -100 : -75)
    .attr("y", d => d.data.type === "equipment" ? -35 : -25)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", d => d.data.type === "equipment" ? "rgb(51,51,51)" : "rgb(245,245,245)")
    .attr("stroke", "none")
    .attr("filter", "url(#dropShadow)");
  
  // ノード内テキストの描画（2行表示）
  node.append("text")
    .attr("text-anchor", "middle")
    .style("font-size", d => d.data.type === "equipment" ? "14px" : "12px")
    .selectAll("tspan")
    .data(d => {
      if(d.data.type === "equipment") {
        // 設備ノード：1行目 name_en、2行目 必要設備数
        return [d.data.name, d.data.required];
      } else {
        // アイテムノード：1行目 name_en、2行目 [required]/min
        return [d.data.name, d.data.required.toFixed(2) + "/min"];
      }
    })
    .enter()
    .append("tspan")
      .attr("x", 0)
      .attr("dy", (d, i) => i === 0 ? "-0.2em" : "1.2em")
      .style("fill", (d, i, nodes) => {
        const nodeType = d3.select(nodes[i].parentNode).datum().data.type;
        return nodeType === "equipment" ? "rgb(255,255,255)" : "rgb(0,0,0)";
      })
      .text(d => d);
  
  // ズームリセットボタン（#resetZoom）の処理
  d3.select("#resetZoom").on("click", function() {
    svgSelection.transition().duration(750).call(zoom.transform, initialTransform);
  });
}
