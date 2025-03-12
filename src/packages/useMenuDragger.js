import { events } from "./events";
export function useMenuDragger(containerRef, data) {
    let currentComponent = null;

    const dragenter = (e) => {
        e.dataTransfer.dropEffect = 'move';
    }
    const dragover = (e) => {
        e.preventDefault();
    }
    const dragleave = (e) => {
        e.dataTransfer.dropEffect = 'none';

    }
    const drop = (e) => {

        let blocks = data.value.blocks
        data.value = {
            ...data.value, blocks: [
                ...blocks, {
                    top: e.offsetY,
                    left: e.offsetX,
                    zIndex: 1,
                    key: currentComponent.key,
                    alignCenter: true,
                    props:{},
                    model:{}
                }
            ]
        }
        
        currentComponent = null
    }
    const dragstart = (e, component) => {
        //进入元素中 添加移动标识
        //经过 阻止默认行为
        //离开的时候 加禁用标识
        //松手 根据拖拽添加组件


        //在进入containerRef拖拽区域时触发的函数
        containerRef.value.addEventListener('dragenter', dragenter)
        containerRef.value.addEventListener('dragover', dragover)
        containerRef.value.addEventListener('dragleave', dragleave)
        containerRef.value.addEventListener('drop', drop)
        console.log(component)
        currentComponent = component
        events.emit('start');
    }

    const dragend = (e) => {
        containerRef.value.removeEventListener('dragenter', dragenter)
        containerRef.value.removeEventListener('dragover', dragover)
        containerRef.value.removeEventListener('dragleave', dragleave)
        containerRef.value.removeEventListener('drop', drop)
        
        events.emit('end')
    }
    return {
        dragstart, dragend
    }
}