import { reactive } from "vue"
import { events } from "./events"

export function useBlockDragger(focusData, lastSelectBlock,data) {
    let dragState = {
        startX: 0,
        startY: 0,
        dragging:false//不是正在拖拽
    }
    let markLine=reactive({
        x:null,
        y:null
    })


    const mouseDown = (e) => {

        const { width: Bwidth, height: Bheight } = lastSelectBlock.value

        dragState = {
            //获得鼠标按下的鼠标和组件方位并存储
            startX: e.clientX,
            startY: e.clientY,
            startLeft: lastSelectBlock.value.left,
            startTop: lastSelectBlock.value.top,
            dragging:false,
            startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
            lines: (() => {
                const { unfocus } = focusData.value //获取没有被选中的组件

                let lines = { x: [], y: [] };//计算横线位置用y存放
                [...unfocus,{
                    top:0,
                    left:0,
                    width:data.value.container.width,
                    height:data.value.container.height
                }].forEach((block) => {
                    const { top: Atop, left: Aleft, width: Awidth, height: Aheight } = block;


                    //存放横线
                    //左线显示位置右参照参照物位置
                    //顶对顶 元素顶部和A元素top一致
                    lines.y.push({ showTop: Atop, top: Atop });
                    //顶对底 元素底部和A元素top一致
                    lines.y.push({ showTop: Atop, top: Atop - Bheight });
                    //中对中 元素中线和A中线对齐
                    lines.y.push({ showTop: Atop + Aheight / 2, top: Atop + Aheight / 2 - Bheight / 2 });
                    //底对顶 元素顶部和A底部对齐
                    lines.y.push({ showTop: Atop + Aheight, top: Atop + Aheight });
                    //底对底 元素底部和A底部对齐
                    lines.y.push({ showTop: Atop + Aheight, top: Atop + Aheight - Bheight });

                    //存放竖线

                    //左对左
                    lines.x.push({ showLeft: Aleft, left: Aleft });
                    //左对右
                    lines.x.push({ showLeft: Aleft + Awidth, left: Aleft + Awidth });
                    //中对中
                    lines.x.push({ showLeft: Aleft + Awidth / 2, left: Aleft + Awidth / 2 - Bwidth / 2 });
                    //右对左
                    lines.x.push({ showLeft: Aleft + Awidth, left: Aleft + Awidth - Bwidth });
                    //右对右
                    lines.x.push({ showLeft: Aleft, left: Aleft - Bwidth });
                });
                return lines;

            })()
        }

        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup)
    }
    const mousemove = (e) => {
        let { clientX: moveX, clientY: moveY } = e;

        if(!dragState.dragging){
            dragState.dragging=true;
            events.emit('start');
        }
        //计算当前元素最新left和top
        let left = moveX - dragState.startX + dragState.startLeft;
        let top = moveY - dragState.startY + dragState.startTop;

        //计算横线 距离参照物5px显示横线

        let y = null;
        let x = null;
        for (let i = 0; i < dragState.lines.y.length; i++) {
            const { top: t, showTop: s } = dragState.lines.y[i];//获取每一根线
            if (Math.abs(t - top) < 10) {
                y = s //当前线显示的位置

                //快速线和元素贴在一起 
                //如果是last元素 先清除所有top值 再加上t值 也就是线的参照值
                //如果是与last元素一起动的其他元素 先算出与last元素的高度差 再加上t值 求出top值
                moveY = dragState.startY - dragState.startTop + t

                break;//找到一根线跳出循环
            }


        }
        for (let i = 0; i < dragState.lines.x.length; i++) {
            const { left: l, showLeft: s } = dragState.lines.x[i];//获取每一根线
            if (Math.abs(l - left) < 10) {
                x = s //当前线显示的位置

                //快速线和元素贴在一起 
                moveX = dragState.startX - dragState.startLeft + l

                break;//找到一根线跳出循环
            }


        }
        markLine.x=x;
        markLine.y=y;//使x，y变化变成响应式



        //获得鼠标移动的距离
        let durX = moveX - dragState.startX;
        let durY = moveY - dragState.startY;
        //block是当前元素的值，idx是当前元素的索引
        focusData.value.focus.forEach((block, idx) => {
            block.top = dragState.startPos[idx].top + durY;
            block.left = dragState.startPos[idx].left + durX;
        })
    }
    const mouseup = (e) => {
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        markLine.x=null;
        markLine.y=null;
        if(dragState.dragging){
            events.emit('end')
        }
        events.emit('end')
    }
    return {
        mouseDown,markLine
    }
}