export async function asyncForEach(array: any[], callback: (item: any, index: number, items: any[]) => {}) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export default { asyncForEach };
