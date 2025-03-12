import { computed ,ref} from "vue";
export function useFocus(data,previewRef,callback){

    //最后一个被选中的索引值
    const selectIndex=ref(-1);//表示没有任何一个被选中

    const lastSelectBlock=computed(()=>data.value.blocks[selectIndex.value])

    const focusData=computed(()=>{
        let focus=[];
        let unfocus=[];
        data.value.blocks.forEach(block=>(block.focus? focus:unfocus).push(block))
        return {focus,unfocus}
    })
    const clearBlockFocus = () => {
        //清空其他人的focus 再添加自己的
        data.value.blocks.forEach(block => block.focus = false)
    }

    const blockMousedown = (e, block,index) => {
        if(previewRef.value) return
        e.preventDefault();
        e.stopPropagation();
        if (e.ctrlKey) {
            if(focusData.value.focus.length<=1){
                block.focus=true
            }else{
                 //可以在键盘按住ctrl的时候切换改变组件被选中的状态
            block.focus = !block.focus
            }
           
        } else {
            if (!block.focus) {
                clearBlockFocus();
                block.focus = true
            }
           
        }
        selectIndex.value=index
        //回调函数
        callback(e)
    }
    const containerMouseDown=()=>{
        if(previewRef.value) return
        selectIndex.value=-1;
        clearBlockFocus();
    }
   
    return {
        blockMousedown,focusData,containerMouseDown,lastSelectBlock,clearBlockFocus
    }
}