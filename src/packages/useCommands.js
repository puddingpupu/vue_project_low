import deepcopy from "deepcopy";
import { events } from "./events";
import { onUnmounted } from "vue";

export function useCommands(data, focusData) {
    const state = {
        current: -1,
        queue: [],//存放所有操作命令
        commands: {}, //制作命令和执行功能一个映射表
        commandArray: [],//存放所有命令
        destoryArray: []
    }

    const registry = (command) => {
        state.commandArray.push(command);
        state.commands[command.name] = (...args) => { //命令名字对应执行函数
            const { redo, undo } = command.execute(...args);
            redo();
            if (!command.pushQueue) {
                //不需要放到队列中
                return
            }
            let { queue, current } = state;
            //在放置过程中有撤回，就截取使queue数组直接等于0到此时指针最大值
            if (queue.length > 0) {
                queue = queue.slice(0, current + 1);
                state.queue = queue;
            }

            queue.push({ redo, undo });
            state.current = current + 1;
           
        }
    }

    //registry注册命令
    //重做
    registry({
        name: 'redo',
        keyboard: 'ctrl+y',
        execute() {
            return {
                redo() {

                    let item = state.queue[state.current + 1];
                    if (item) {
                        item.redo && item.redo();
                        state.current++;
                    }
                }
            }

        }
    })
    //撤销
    registry({
        name: 'undo',
        keyboard: 'ctrl+z',
        execute() {
            return {
                redo() {

                    if (state.current >= 0) {  
                        let item = state.queue[state.current];  
                        if (item && item.undo) {  
                            item.undo();  
                            state.current--;  
                        }  
                    }  
                }
            }
        }
    })
    //将操作放到队列中 增加一个属性 拖拽放入
    registry({
        name: 'drag',
        pushQueue: true,

        init() {
            // debugger;
            //保存之前的状态
            this.before = null
            //监控拖拽开始的事件
            const start = () => { this.before = deepcopy(data.value.blocks); console.log(data.value.blocks)}
            //拖拽结束后触发对应反应
            const end = () => {

                state.commands.drag()
            }
            events.on('start', start)
            events.on('end', end)
            return () => {
                events.off('start', start);
                events.off('end', end)
            }
        },
        execute() {
            let before = this.before
            let after = data.value.blocks
            return {
                redo() {
                    data.value = { ...data.value, blocks: after }
                },
                undo() {
                    data.value = { ...data.value, blocks: before }
                }
            }
        }
    })
    //监控页面全局变化
    registry({
        name: 'updateContainer',
        pushQueue: true,
        execute(newValue) {
            let state = {
                before: data.value,
                after: newValue
            }
            return {
                redo: () => {
                    data.value = state.after
                },
                undo: () => {
                    data.value = state.before
                }
            }
        }
    })
    //监控某一组件 
    registry({
        name: 'updateBlock',
        pushQueue: true,
        execute(newBlock,oldBlock) {
            let state = {
                before: data.value.blocks,
                after: (()=>{
                    let blocks=[...data.value.blocks];
                    const index=data.value.blocks.indexOf(oldBlock);
                    if(index>-1){
                        blocks.splice(index,1,newBlock)
                    }
                    return blocks
                })()
            }
            return {
                redo: () => {
                    data.value = {...data.value,blocks:state.after}
                },
                undo: () => {
                    data.value = {...data.value,blocks:state.before}
                }
            }
        }
    })
    registry({
        name: 'placeTop',
        pushQueue: true,
        execute() {
            let before = deepcopy(data.value.blocks)
            let after = (() => {
                let { focus, unfocus } = focusData.value

                let maxZIndex = unfocus.reduce((prev, block) => {
                    return Math.max(prev, block.zIndex);
                }, -Infinity);
                focus.forEach(block => block.zIndex = maxZIndex + 1);

                return data.value.blocks
            })()

            return {
                undo: () => {
                    data.value = { ...data.value, blocks: before }
                },
                redo: () => {
                    data.value = { ...data.value, blocks: after }
                }
            }
        }
    })
    registry({
        name: 'placeBottom',
        pushQueue: true,

        execute(){
            let before=deepcopy(data.value.blocks)
            let after=(()=>{
                let {focus,unfocus}=focusData.value;

                let minZIdex=unfocus.reduce((pre,block)=>{
                    return Math.min(pre,block.zIndex);
                },Infinity)-1;//不能直接减一，如果出现负值组件会直接消失

                if(minZIdex<0){
                    const dur=Math.abs(minZIdex);
                    minZIdex=0;
                    unfocus.forEach(block=>block.zIndex+=dur)
                }
                focus.forEach(block=>block.zIndex=minZIdex);
                return data.value.blocks
            })()


            return{
            undo: () => {
                data.value={...data.value,blocks:before}
            },
            redo: () => {
                data.value={...data.value,blocks:after}
            }
        }
        }
    })
    registry({
        name: 'delete',
        pushQueue:true,
        execute() {
            let state={
                before:deepcopy(data.value.blocks),
                after:focusData.value.unfocus
            }
            return {
                redo:()=> {
                    data.value={...data.value,blocks:state.after}
                },
                undo:()=>{
                    data.value={...data.value,blocks:state.before}
                }
            }

        }
    })

    const keyboardEvent = (() => {
        const KeyCodes = {
            90: 'z',
            89: 'y'
        }
        const onkeydown = (e) => {
            const { ctrlKey, keyCode } = e;
            let keyString = [];
            if (ctrlKey) keyString.push('ctrl');
            keyString.push(KeyCodes[keyCode]);
            keyString = keyString.join('+');

            state.commandArray.forEach(({ keyboard, name }) => {
                if (!keyboard) return;
                if (keyboard === keyString) {
                    state.commands[name]();
                    e.preventDefault();

                }
            })
        }
        const init = () => {
            window.addEventListener('keydown', onkeydown)
            return () => {
                window.removeEventListener('keydown', onkeydown)
            }
        }
        return init
    })()

        ; (() => {

            //监听键盘事件
            state.destoryArray.push(keyboardEvent())

            state.commandArray.forEach(command => command.init && state.destoryArray.push(command.init()))
        })();

    onUnmounted(() => {//清理绑定的事件
        state.destoryArray.forEach(fn => fn && fn());
    })
    return state;
}